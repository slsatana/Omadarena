const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

(async () => {
  const user = await prisma.user.findUnique({ where: { phone: '+998998137861' } });
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });
  const axios = require('axios');
  
  try {
     const res2 = await axios.patch('http://localhost:3000/api/v1/admin/games/TETRIS', { isActive: false }, {
       headers: { Authorization: `Bearer ${token}` }
     });
     console.log("Disable:", res2.status, res2.data.isActive);
     
     const res3 = await axios.patch('http://localhost:3000/api/v1/admin/games/TETRIS', { isActive: true }, {
       headers: { Authorization: `Bearer ${token}` }
     });
     console.log("Enable:", res3.status, res3.data.isActive);
  } catch(e) {
     console.error("Error patching:", e.response ? e.response.data : e.message);
  }
})();
