import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const network = await prisma.venueNetwork.findFirst();
  if (!network) throw new Error("No network found");

  const games = [
    { id: 'NEON_JUMP', name: 'Neon Jump', venueNetworkId: network.id, scoreToPointsRatio: 0.5, maxScorePerMinute: 2000, isActive: true },
    { id: 'CYBER_SHIELD', name: 'Cyber Shield', venueNetworkId: network.id, scoreToPointsRatio: 0.5, maxScorePerMinute: 2000, isActive: true },
    { id: 'HIGHER_LOWER', name: 'Higher Lower', venueNetworkId: network.id, scoreToPointsRatio: 0.5, maxScorePerMinute: 2000, isActive: true },
    { id: 'SNAKE', name: 'Snake', venueNetworkId: network.id, scoreToPointsRatio: 0.5, maxScorePerMinute: 2000, isActive: true },
    { id: 'SKY_STACK', name: 'Sky Stack', venueNetworkId: network.id, scoreToPointsRatio: 0.5, maxScorePerMinute: 2000, isActive: true },
    { id: 'MATCH3', name: 'Match 3', venueNetworkId: network.id, scoreToPointsRatio: 0.5, maxScorePerMinute: 2000, isActive: true },
    { id: 'COLOR_SORT', name: 'Color Sort', venueNetworkId: network.id, scoreToPointsRatio: 0.5, maxScorePerMinute: 2000, isActive: true },
    { id: 'TETRIS', name: 'Tetris', venueNetworkId: network.id, scoreToPointsRatio: 0.5, maxScorePerMinute: 2000, isActive: true }
  ];

  for (const g of games) {
    await prisma.game.upsert({
      where: { id: g.id },
      update: {},
      create: g,
    });
  }
  console.log("8 Games Added/Upserted!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
