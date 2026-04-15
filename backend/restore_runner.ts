import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const network = await prisma.venueNetwork.findFirst();
  if (!network) throw new Error("No network found");

  await prisma.game.upsert({
    where: { id: 'ARENA_RUNNER' },
    update: {},
    create: {
        id: 'ARENA_RUNNER',
        name: 'Omad Arena 3D Runner',
        venueNetworkId: network.id,
        scoreToPointsRatio: 0.1,
        maxScorePerMinute: 3000,
        isActive: true,
    },
  });
  console.log("Restored ARENA_RUNNER!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
