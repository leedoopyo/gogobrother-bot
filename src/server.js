const express = require('express');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('gogobrother bot is running');
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/webhook', (req, res) => {
  const userId = req.body.userId || 'test-user';
  const message = req.body.message || '';

  res.json({
    reply: `받은 메시지: ${message}`
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running`);
});
