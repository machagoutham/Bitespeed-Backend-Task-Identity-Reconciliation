import { Request, Response } from 'express';
import { identifyService } from '../services/identify.service';

export const identify = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body as {
      email?: string | null;
      phoneNumber?: string | number | null;
    };

    const emailStr = email ? String(email).trim().toLowerCase() : undefined;
    const phoneStr = phoneNumber != null ? String(phoneNumber).trim() : undefined;

    if (!emailStr && !phoneStr) {
      return res.status(400).json({ error: 'At least email or phoneNumber is required' });
    }

    const result = await identifyService(emailStr, phoneStr);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Identify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};