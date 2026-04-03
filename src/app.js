const express = require('express');
const webhookRouter = require('./routes/webhook');
const healthRouter = require('./routes/health');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/webhook', webhookRouter);
app.use('/health', healthRouter);

// 루트
app.get('/', (req, res) => {
  res.send('gogobrother bot is running');
});

// 지역 디버그용
app.get('/regions', async (req, res) => {
  try {
    const { listRegion1 } = require('./services/regionService');
    const region1List = await listRegion1();
    res.json({ region1List });
  } catch (error) {
    console.error('GET /regions error:', error);
    res.status(500).json({
      error: '지역 데이터를 불러오지 못했습니다.',
      detail: error.message,
    });
  }
});

module.exports = app;
