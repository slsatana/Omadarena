const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const data = await prisma.game.findMany({ include: { venueNetwork: { select: { id: true, name: true, isActive: true } } } });
    console.log(data.map(d => ({ id: d.id, isActive: d.isActive })));
}
main().finally(() => prisma.$disconnect());
