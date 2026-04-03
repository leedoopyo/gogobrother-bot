import express from "express";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 메모리 세션 (베타용)
const sessions = {};

// Google Sheets 연결
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : "",
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

// 시트 데이터 읽기
async function getRegionRows() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "region_master!A:D",
  });

  return response.data.values || [];
}

// 헤더 포함 rows -> object 배열
function rowsToObjects(rows) {
  const [header, ...data] = rows;
  if (!header) return [];

  return data.map((row) => {
    const obj = {};
    header.forEach((key, idx) => {
      obj[key] = row[idx] ?? "";
    });
    return obj;
  });
}

async function getRegionMaster() {
  const rows = await getRegionRows();
  const items = rowsToObjects(rows);

  return items
    .filter((item) => item.active === "Y")
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
}

async function getRegion1List() {
  const items = await getRegionMaster();
  const unique = [];

  for (const item of items) {
    if (!unique.includes(item.region1)) {
      unique.push(item.region1);
    }
  }

  return unique;
}

async function getRegion2List(region1) {
  const items = await getRegionMaster();

  return items
    .filter((item) => item.region1 === region1)
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    .map((item) => item.region2);
}

function getMainMenu() {
  return `안녕하세요. 고고브라더입니다.

1. 주문 시작
2. 이용 방법
0. 처음으로`;
}

function formatNumberedMenu(title, items) {
  const lines = [title, ""];

  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item}`);
  });

  lines.push("0. 처음으로");

  return lines.join("\n");
}

// health check
app.get("/", (req, res) => {
  res.send("gogobrother bot is running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// region debug
app.get("/regions", async (req, res) => {
  try {
    const region1List = await getRegion1List();
    res.json({ region1List });
  } catch (error) {
    console.error("GET /regions error:", error);
    res.status(500).json({
      error: "지역 데이터를 불러오지 못했습니다.",
      detail: error.message,
    });
  }
});

// chatbot webhook
app.post("/webhook", async (req, res) => {
  try {
    const userId = req.body.userId || "test-user";
    const message = String(req.body.message || "").trim();

    if (!sessions[userId]) {
      sessions[userId] = {
        state: "MAIN",
        region1: null,
        region2: null,
        apartment: null,
      };
    }

    const session = sessions[userId];

    // 초기화
    if (!message || message === "0") {
      sessions[userId] = {
        state: "MAIN",
        region1: null,
        region2: null,
        apartment: null,
      };

      return res.json({ reply: getMainMenu() });
    }

    // 메인
    if (session.state === "MAIN") {
      if (message === "1") {
        const region1List = await getRegion1List();

        session.state = "REGION1";

        return res.json({
          reply: formatNumberedMenu("주문하실 지역을 선택해주세요.", region1List),
        });
      }

      if (message === "2") {
        return res.json({
          reply: `이용 방법 안내

1을 누르면 주문을 시작합니다.
지역 → 동 → 아파트 순서로 입력합니다.
0을 누르면 처음으로 돌아갑니다.`,
        });
      }

      return res.json({ reply: getMainMenu() });
    }

    // 1차 지역 선택
    if (session.state === "REGION1") {
      const region1List = await getRegion1List();
      const selectedRegion1 = region1List[Number(message) - 1];

      if (!selectedRegion1) {
        return res.json({ reply: "올바른 번호를 입력해주세요." });
      }

      session.region1 = selectedRegion1;
      session.state = "REGION2";

      const region2List = await getRegion2List(selectedRegion1);

      return res.json({
        reply: formatNumberedMenu(
          `${selectedRegion1} 상세 지역을 선택해주세요.`,
          region2List
        ),
      });
    }

    // 2차 지역 선택
    if (session.state === "REGION2") {
      const region2List = await getRegion2List(session.region1);
      const selectedRegion2 = region2List[Number(message) - 1];

      if (!selectedRegion2) {
        return res.json({ reply: "올바른 번호를 입력해주세요." });
      }

      session.region2 = selectedRegion2;
      session.state = "APARTMENT";

      return res.json({
        reply: `${session.region1} ${session.region2} 선택됨

아파트 또는 건물명을 입력해주세요.
예: 만현마을5단지 / 신봉마을LG빌리지 / 상가건물

0. 처음으로`,
      });
    }

    // 아파트 입력
    if (session.state === "APARTMENT") {
      session.apartment = message;
      session.state = "DONE";

      return res.json({
        reply: `입력 완료

지역: ${session.region1}
동: ${session.region2}
아파트/건물명: ${session.apartment}

다음 단계: 메뉴 연결 준비중
0. 처음으로`,
      });
    }

    // 완료 상태
    if (session.state === "DONE") {
      return res.json({
        reply: `이미 입력이 완료되었습니다.

지역: ${session.region1}
동: ${session.region2}
아파트/건물명: ${session.apartment}

0을 누르면 처음으로 돌아갑니다.`,
      });
    }

    return res.json({ reply: getMainMenu() });
  } catch (error) {
    console.error("POST /webhook error:", error);
    return res.status(500).json({
      reply: "서버 오류가 발생했습니다. Google Sheets 설정 또는 Railway Variables를 확인해주세요.",
      detail: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
