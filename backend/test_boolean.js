const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
     const res = await prisma.game.update({ where: { id: 'TETRIS' }, data: { isActive: "true" } });
     console.log("Success");
  } catch(e) {
     console.error("Prisma error:", e.message);
  }
}
main().finally(() => prisma.$disconnect());
