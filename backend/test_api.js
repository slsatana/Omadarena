const axios = require('axios');
async function test() {
  try {
    const res = await axios.patch('http://localhost:3000/api/v1/admin/games/TETRIS', { isActive: true }, {
      headers: { Authorization: "Bearer 999999" }
    });
    console.log("Success:", res.data);
  } catch(e) {
    console.error("Error:", e.response ? e.response.data : e.message);
  }
}
test();
