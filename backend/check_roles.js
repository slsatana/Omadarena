const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    include: { roleAssignments: true }
  });
  console.log(JSON.stringify(users.map(u => ({ name: u.displayName, roles: u.roleAssignments })), null, 2));
}
main().finally(() => prisma.$disconnect());
