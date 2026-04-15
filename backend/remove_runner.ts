import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting full cascade cleanup for ARENA_RUNNER...');
  
  const sessions = await prisma.gameSession.findMany({ where: { gameId: 'ARENA_RUNNER' }, select: { id: true } });
  const sessionIds = sessions.map(s => s.id);
  
  await prisma.gameResult.deleteMany({ where: { sessionId: { in: sessionIds } } });
  await prisma.gameSession.deleteMany({ where: { gameId: 'ARENA_RUNNER' } });
  await prisma.dailyAttemptProgression.deleteMany({ where: { gameId: 'ARENA_RUNNER' } });
  
  const prizes = await prisma.prize.findMany({ where: { gameId: 'ARENA_RUNNER' }, select: { id: true } });
  const prizeIds = prizes.map(p => p.id);
  
  await prisma.prizeClaim.deleteMany({ where: { prizeId: { in: prizeIds } } });
  await prisma.order.deleteMany({ where: { prizeId: { in: prizeIds } } });
  await prisma.prize.deleteMany({ where: { gameId: 'ARENA_RUNNER' } });
  
  await prisma.game.deleteMany({ where: { id: 'ARENA_RUNNER' } });
  
  console.log('Deleted ARENA_RUNNER successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
