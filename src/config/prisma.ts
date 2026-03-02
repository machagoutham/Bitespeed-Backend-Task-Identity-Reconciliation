// src/config/prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  // Optional: helpful during development
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Optional but recommended: graceful shutdown
// (helps avoid connection leaks in development when you hot-reload)
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

export default prisma;