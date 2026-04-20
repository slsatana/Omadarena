const axios = require('axios');
const jwt = require('jsonwebtoken');

(async () => {
  const token = jwt.sign({ sub: 'S-ADMIN-ID', role: 'SUPER_ADMIN' }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });
  try {
     const res = await axios.get('http://localhost:3000/api/v1/admin/games', {
       headers: { Authorization: `Bearer ${token}` }
     });
     console.log(res.data.map(d => ({ id: d.id, isActive: d.isActive })));
  } catch(e) {
     console.error("Error:", e.response ? e.response.data : e.message);
  }
})();
