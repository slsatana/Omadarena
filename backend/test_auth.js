const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

(async () => {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  const token = jwt.sign({ sub: user.id, role: 'USER', deviceId: 'test' }, 'secret_key_here'); // I don't have the secret key

  // wait I can just query Prisma and check if friendCode is selected in Prisma!
  const res = await prisma.user.findFirst({ select: { friendCode: true } });
  console.log(res);
})();
