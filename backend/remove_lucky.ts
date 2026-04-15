import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting full cascade cleanup for LUCKY_WHEEL...');
  
  const sessions = await prisma.gameSession.findMany({ where: { gameId: 'LUCKY_WHEEL' }, select: { id: true } });
  const sessionIds = sessions.map(s => s.id);
  
  await prisma.gameResult.deleteMany({ where: { sessionId: { in: sessionIds } } });
  await prisma.gameSession.deleteMany({ where: { gameId: 'LUCKY_WHEEL' } });
  await prisma.dailyAttemptProgression.deleteMany({ where: { gameId: 'LUCKY_WHEEL' } });
  
  const prizes = await prisma.prize.findMany({ where: { gameId: 'LUCKY_WHEEL' }, select: { id: true } });
  const prizeIds = prizes.map(p => p.id);
  
  await prisma.prizeClaim.deleteMany({ where: { prizeId: { in: prizeIds } } });
  await prisma.order.deleteMany({ where: { prizeId: { in: prizeIds } } });
  await prisma.prize.deleteMany({ where: { gameId: 'LUCKY_WHEEL' } });
  
  await prisma.game.deleteMany({ where: { id: 'LUCKY_WHEEL' } });
  
  console.log('Deleted LUCKY_WHEEL successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
