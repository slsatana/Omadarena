const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { phone: '+998998137861' },
    include: {
      wallet: { select: { balance: true } },
      gameSessions: { include: { game: { select: { name: true } }, result: { select: { timePlayedSeconds: true } } } },
      _count: { select: { orders: true } }
    }
  });
  console.log(JSON.stringify(users, (key, value) => typeof value === "bigint" ? value.toString() : value, 2));
}
main().finally(() => prisma.$disconnect());
