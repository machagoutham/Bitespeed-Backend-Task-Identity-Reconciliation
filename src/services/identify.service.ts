import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';   
export interface ContactResponse {
  contact: {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export const identifyService = async (
  email?: string,
  phoneNumber?: string
): Promise<ContactResponse> => {
  const primaryIds = new Set<number>();

  // === 1. Find all matching roots (flat tree) ===
  if (email) {
    const matches = await prisma.contact.findMany({
      where: { email, deletedAt: null },
      select: { id: true, linkedId: true, linkPrecedence: true },
    });
    for (const c of matches) {
      const root = c.linkPrecedence === 'PRIMARY' ? c.id : (c.linkedId as number);
      primaryIds.add(root);
    }
  }

  if (phoneNumber) {
    const matches = await prisma.contact.findMany({
      where: { phoneNumber, deletedAt: null },
      select: { id: true, linkedId: true, linkPrecedence: true },
    });
    for (const c of matches) {
      const root = c.linkPrecedence === 'PRIMARY' ? c.id : (c.linkedId as number);
      primaryIds.add(root);
    }
  }

  let finalPrimaryId: number;

  if (primaryIds.size === 0) {
    // New customer
    const newContact = await prisma.contact.create({
      data: {
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        linkPrecedence: 'PRIMARY',
      },
    });
    finalPrimaryId = newContact.id;
  } else {
    finalPrimaryId = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let mainPrimaryId = Array.from(primaryIds)[0];

      if (primaryIds.size > 1) {
        const primaryList = await tx.contact.findMany({
          where: { id: { in: Array.from(primaryIds) } },
          select: { id: true, createdAt: true },
        });

        primaryList.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        mainPrimaryId = primaryList[0].id;

        // Merge all other trees into the oldest primary
        for (const p of primaryList) {
          if (p.id === mainPrimaryId) continue;

          await tx.contact.updateMany({
            where: { linkedId: p.id, deletedAt: null },
            data: { linkedId: mainPrimaryId, updatedAt: new Date() },
          });

          await tx.contact.update({
            where: { id: p.id },
            data: {
              linkedId: mainPrimaryId,
              linkPrecedence: 'SECONDARY',
              updatedAt: new Date(),
            },
          });
        }
      }

      // === 2. Does this request contain NEW information? ===
      const group = await tx.contact.findMany({
        where: {
          OR: [{ id: mainPrimaryId }, { linkedId: mainPrimaryId }],
          deletedAt: null,
        },
        select: { email: true, phoneNumber: true },
      });

      const allEmails = new Set(group.map((c) => c.email).filter(Boolean));
      const allPhones = new Set(group.map((c) => c.phoneNumber).filter(Boolean));

      const hasNewEmail = !!email && !allEmails.has(email);
      const hasNewPhone = !!phoneNumber && !allPhones.has(phoneNumber);

      if (hasNewEmail || hasNewPhone) {
        await tx.contact.create({
          data: {
            email: email ?? null,
            phoneNumber: phoneNumber ?? null,
            linkedId: mainPrimaryId,
            linkPrecedence: 'SECONDARY',
          },
        });
      }

      return mainPrimaryId;
    });
  }

  // === 3. Build final consolidated response ===
  const primaryContact = await prisma.contact.findUniqueOrThrow({
    where: { id: finalPrimaryId },
  });

  const secondaryIds = (
    await prisma.contact.findMany({
      where: { linkedId: finalPrimaryId, deletedAt: null },
      select: { id: true },
    })
  ).map((c) => c.id);

  const groupForLists = await prisma.contact.findMany({
    where: {
      OR: [{ id: finalPrimaryId }, { linkedId: finalPrimaryId }],
      deletedAt: null,
    },
    select: { email: true, phoneNumber: true },
  });

  // Emails – primary first
  const emailSet = new Set<string>(groupForLists.map((c) => c.email).filter((e): e is string => !!e));
  let emails: string[] = primaryContact.email
    ? [primaryContact.email, ...Array.from(emailSet).filter((e) => e !== primaryContact.email)]
    : Array.from(emailSet);

  // Phones – primary first
  const phoneSet = new Set<string>(groupForLists.map((c) => c.phoneNumber).filter((p): p is string => !!p));
  let phoneNumbers: string[] = primaryContact.phoneNumber
    ? [primaryContact.phoneNumber, ...Array.from(phoneSet).filter((p) => p !== primaryContact.phoneNumber)]
    : Array.from(phoneSet);

  return {
    contact: {
      primaryContactId: finalPrimaryId,
      emails,
      phoneNumbers,
      secondaryContactIds: secondaryIds,
    },
  };
};