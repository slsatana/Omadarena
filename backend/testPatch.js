const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const g1 = await prisma.game.findFirst({where:{id:'ARENA_RUNNER'}});
  console.log("Before:", g1.displayName, g1.imageUrl);
  
  const gameConfigs = { ARENA_RUNNER: { displayName: "Super Dodge Test", imageUrl: "http://example.com/test.png" } };
  for (const gid of Object.keys(gameConfigs)) {
     await prisma.game.update({
       where: { id: gid },
       data: {
         displayName: gameConfigs[gid]?.displayName || null,
         imageUrl: gameConfigs[gid]?.imageUrl || null,
       }
     });
  }
  
  const g2 = await prisma.game.findFirst({where:{id:'ARENA_RUNNER'}});
  console.log("After:", g2.displayName, g2.imageUrl);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
