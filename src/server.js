const express = require('express');

const app = express();
app.use(express.json());

const sessions = {};

function getMainMenu() {
  return `안녕하세요. 고고브라더입니다.

1. 주문 시작
2. 이용 방법`;
}

function getRegionMenu() {
  return `주문하실 지역을 선택해주세요.

1. 수지
2. 기흥
0. 처음으로`;
}

app.get('/', (req, res) => {
  res.send('gogobrother bot is running');
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/webhook', (req, res) => {
  const userId = req.body.userId || 'test-user';
  const message = String(req.body.message || '').trim();

  if (!sessions[userId]) {
    sessions[userId] = { state: 'MAIN' };
  }

  const session = sessions[userId];

  if (!message || message === '0') {
    session.state = 'MAIN';
    return res.json({ reply: getMainMenu() });
  }

  if (session.state === 'MAIN') {
    if (message === '1') {
      session.state = 'REGION';
      return res.json({ reply: getRegionMenu() });
    }

    if (message === '2') {
      return res.json({
        reply: '이용 방법 안내\n\n1을 누르면 주문을 시작할 수 있습니다.\n0을 누르면 처음으로 돌아갑니다.',
      });
    }

    return res.json({ reply: getMainMenu() });
  }

  if (session.state === 'REGION') {
    if (message === '1') {
      session.region = '수지';
      return res.json({
        reply: `수지 선택됨\n\n다음 단계 준비중...`,
      });
    }

    if (message === '2') {
      session.region = '기흥';
      return res.json({
        reply: `기흥 선택됨\n\n다음 단계 준비중...`,
      });
    }

    return res.json({ reply: '올바른 번호를 입력해주세요.' });
  }

  return res.json({ reply: getMainMenu() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Server running');
});
