import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const network = await prisma.venueNetwork.findFirst();
  if (!network) {
    console.log('No venue network found');
    return;
  }

  const games = [
    { id: 'NEON_JUMP', name: 'Neon Jump' },
    { id: 'CYBER_SHIELD', name: 'Cyber Shield' },
    { id: 'HIGHER_LOWER', name: 'Higher Lower' },
    { id: 'SNAKE', name: 'Snake' },
    { id: 'SKY_STACK', name: 'Sky Stack' },
    { id: 'MATCH3', name: 'Match 3' },
    { id: 'COLOR_SORT', name: 'Color Balls' },
    { id: 'TETRIS', name: 'Tetris' },
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: { id: game.id },
      update: {},
      create: {
        id: game.id,
        name: game.name,
        venueNetworkId: network.id,
        scoreToPointsRatio: 0.5,
        maxScorePerMinute: 3000,
        dailyPointsLimit: 5000,
        dailyAttemptsLimit: 5,
        isActive: true,
      }
    });
    console.log(`Upserted ${game.id}`);
  }
}

main().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
