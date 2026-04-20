const axios = require('axios');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const user = await prisma.user.findFirst({ where: { roleAssignments: { some: { role: 'SUPER_ADMIN' } } } });
  const token = jwt.sign({ sub: user.id, phone: user.phone }, process.env.JWT_SECRET || 'SUPER_SECRET_FALLBACK', { expiresIn: '1h' });
  
  try {
     const res = await axios.patch('http://localhost:3000/api/v1/admin/games/TETRIS', { isActive: true }, {
       headers: { Authorization: `Bearer ${token}` }
     });
     console.log("PATCH Success:", res.status, res.data.isActive);
  } catch(e) {
     console.error("PATCH Error:", e.response ? e.response.data : e.message);
  }
  
  try {
     const res2 = await axios.get('http://localhost:3000/api/v1/admin/games', {
       headers: { Authorization: `Bearer ${token}` }
     });
     console.log("GET Success. TETRIS isActive:", res2.data.find(g => g.id === 'TETRIS').isActive);
  } catch(e) {
     console.error("GET Error:", e.response ? e.response.data : e.message);
  }
})();
