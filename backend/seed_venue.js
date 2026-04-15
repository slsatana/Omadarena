const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const vn = await prisma.venueNetwork.create({
    data: { name: 'Gorgeous Capital', isActive: true }
  });
  console.log('Created:', vn.id);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
