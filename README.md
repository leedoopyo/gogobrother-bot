# gogobrother-bot

고고브라더 주문봇 서버 (Railway + Google Sheets + Google Forms)

## 구조

```
gogobrother-bot/
├─ src/
│  ├─ app.js                    # Express 앱 설정
│  ├─ server.js                 # 서버 진입점
│  ├─ config/
│  │  ├─ env.js                 # 환경변수 로더
│  │  └─ google.js              # Google API 인증
│  ├─ routes/
│  │  ├─ webhook.js             # POST /webhook
│  │  └─ health.js              # GET /health
│  ├─ controllers/
│  │  └─ webhookController.js   # 대화 흐름 제어
│  ├─ services/
│  │  ├─ sessionService.js      # 세션 관리 (메모리)
│  │  ├─ regionService.js       # 지역 선택 로직
│  │  ├─ menuService.js         # 메뉴 조회 로직
│  │  ├─ formService.js         # Google Forms 링크 생성
│  │  ├─ messageService.js      # 응답 메시지 포맷
│  │  └─ googleSheetsService.js # Sheets API 호출
│  ├─ repositories/
│  │  ├─ regionRepository.js    # region_master 시트 읽기
│  │  └─ menuRepository.js      # weekly_menu 시트 읽기
│  └─ utils/
│     ├─ constants.js           # 세션 상태 상수
│     ├─ helpers.js             # 공통 유틸 함수
│     └─ logger.js              # 로그 유틸
├─ .env.example
├─ .gitignore
├─ package.json
└─ railway.json
```

## Google Sheets 구조

### region_master

| region1 | region2 | active | sort_order |
|---------|---------|--------|------------|
| 수지    | 상현동  | Y      | 1          |
| 수지    | 풍덕천동| Y      | 2          |

### weekly_menu

| menu_id | week_key | category | day | menu_name | description | delivery_time | flyer_url | shorts_url | order_form_url | active | sort_order |
|---------|----------|----------|-----|-----------|-------------|---------------|-----------|------------|----------------|--------|------------|
| M001    | 2026-W14 | 전국맛집 | 월  | 성심당 소금빵 세트 | 당일입고 | 19:30~20:00 | ... | ... | ... | Y | 1 |

## 환경변수

`.env.example` 파일 참고

```
GOOGLE_SHEETS_ID=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
BASE_FORM_URL=
FORM_REGION1_ENTRY=
FORM_REGION2_ENTRY=
FORM_APARTMENT_ENTRY=
FORM_MENU_ENTRY=
FORM_DAY_ENTRY=
```

## 대화 흐름

```
MAIN
 └─ 1. 주문 시작
     └─ SELECT_REGION_1 (지역 선택)
         └─ SELECT_REGION_2 (상세 지역 선택)
             └─ INPUT_APARTMENT (아파트명 입력)
                 └─ SELECT_MENU_CATEGORY (카테고리 선택)
                     └─ SELECT_DAY (요일 선택)
                         └─ VIEW_MENU_DETAIL (메뉴 상세)
                             └─ READY_TO_ORDER (주문 폼 링크 전달)
```

## 로컬 실행

```bash
npm install
cp .env.example .env
# .env 파일 채우기
npm run dev
```

## 테스트 (hoppscotch.io 또는 curl)

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","message":""}'
```

## Railway 배포

1. GitHub에 push
2. Railway에서 repo 연결
3. Variables에 환경변수 설정
4. 자동 배포 완료
