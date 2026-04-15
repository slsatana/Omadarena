import { PrismaClient, Role, UserStatus, WalletTxType, SessionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Создаем сеть заведений
  const network = await prisma.venueNetwork.create({
    data: {
      name: 'Black Star Burger Network',
      isActive: true,
    },
  });
  console.log(`✅ Venue Network created: ${network.name}`);

  // 2. Создаем Игры
  const gameArenaRunner = await prisma.game.create({
    data: {
      id: 'ARENA_RUNNER',
      name: 'Omad Arena 3D Runner',
      venueNetworkId: network.id,
      scoreToPointsRatio: 0.1, // 10 score = 1 point
      maxScorePerMinute: 3000,
      isActive: true,
    },
  });

  const gameLuckyWheel = await prisma.game.create({
    data: {
      id: 'LUCKY_WHEEL',
      name: 'Lucky Spin',
      venueNetworkId: network.id,
      scoreToPointsRatio: 1.0,
      maxScorePerMinute: 1000,
      isActive: true,
    },
  });
  console.log(`✅ Games created!`);

  // 3. Создаем Призы
  await prisma.prize.create({
    data: {
      name: 'Free Burger Combo',
      cost: 500,
      gameId: gameLuckyWheel.id,
      imageUrl: 'https://placehold.co/400x400/18181b/a78bfa?text=Burger',
      stockCount: 100,
      isActive: true,
    },
  });

  await prisma.prize.create({
    data: {
      name: '10% Discount Code',
      cost: 100,
      gameId: gameArenaRunner.id,
      imageUrl: 'https://placehold.co/400x400/18181b/fbbf24?text=10%25',
      stockCount: 5000,
      isActive: true,
    },
  });
  console.log(`✅ Prizes created!`);

  // 4. Создаем Суперадмина и Юзеров
  const superAdmin = await prisma.user.create({
    data: {
      phone: '+998901234567',
      displayName: 'Timur (Founder)',
      username: 'timur_founder',
      status: UserStatus.ACTIVE,
      wallet: { create: { balance: 10000000n } },
      roleAssignments: {
        create: { role: Role.SUPER_ADMIN },
      },
    },
  });

  // Генерируем фейковых активных юзеров
  const fakeUsers = [];
  for (let i = 1; i <= 15; i++) {
    const user = await prisma.user.create({
      data: {
        phone: `+9989000000${i.toString().padStart(2, '0')}`,
        displayName: `Player ${i}`,
        username: `player_${i}`,
        status: UserStatus.ACTIVE,
        wallet: { create: { balance: BigInt(Math.floor(Math.random() * 50000)) } },
      },
      include: { wallet: true },
    });
    fakeUsers.push(user);
  }
  console.log(`✅ Users created!`);

  // 5. Симулируем последние транзакции (чтобы график не был пустым)
  console.log('⏳ Generating fake ledger transactions...');
  for (const user of fakeUsers) {
    if (!user.wallet) continue;
    // Даем им рандомные транзакции начисления
    await prisma.walletTransaction.create({
      data: {
        userId: user.id,
        walletId: user.wallet.id,
        type: WalletTxType.GAME_EARN,
        amount: Math.floor(Math.random() * 500) + 10,
        balanceBefore: 0n,
        balanceAfter: user.wallet.balance,
        referenceType: 'GameSession',
        referenceId: `MOCK_SESSION_${user.id}`,
        idempotencyKey: `MOCK_IDEMP_${user.id}_EARN`,
      },
    });

    // Шанс что юзер купил приз
    if (Math.random() > 0.5) {
      await prisma.walletTransaction.create({
        data: {
          userId: user.id,
          walletId: user.wallet.id,
          type: WalletTxType.PRIZE_PURCHASE,
          amount: -500,
          balanceBefore: user.wallet.balance + 500n,
          balanceAfter: user.wallet.balance,
          referenceType: 'PrizeOrder',
          referenceId: `MOCK_ORDER_${user.id}`,
          idempotencyKey: `MOCK_IDEMP_${user.id}_PURCHASE`,
        },
      });
    }
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
