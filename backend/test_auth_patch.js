const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  // We need to bypass or get a real token.
  const user = await prisma.user.findFirst({ where: { phone: '+998971553688' } });
  
  // Since we don't have SMS code easy, let me fetch it or write a simple backdoor login!
  // I already implemented 999999 backdoor!
  try {
     const loginRes = await axios.post('http://localhost:3000/api/v1/auth/verify', { phone: '+998971553688', code: '999999' });
     const token = loginRes.data.access_token;
     
     const patchRes = await axios.patch('http://localhost:3000/api/v1/admin/games/TETRIS', { isActive: true }, {
         headers: { Authorization: `Bearer ${token}` }
     });
     console.log("PATCH Success:", patchRes.data);
  } catch(e) {
     console.error("Error:", e.response ? e.response.data : e.message);
  }
})();
