const { getSession, updateSession, resetSession } = require('../services/sessionService');
const { listRegion1, listRegion2 } = require('../services/regionService');
const { listCategories, listDaysByCategory, getMenuDetail } = require('../services/menuService');
const { buildOrderFormUrl } = require('../services/formService');
const {
  formatNumberedList,
  welcomeMessage,
  mainMenuMessage,
  helpMessage,
  menuDetailMessage,
  orderConfirmMessage,
} = require('../services/messageService');
const logger = require('../utils/logger');

function kakaoResponse(text) {
  return {
    version: '2.0',
    template: {
      outputs: [{ simpleText: { text } }],
    },
  };
}

async function handleWebhook(req, res) {
  try {
    const userId =
      req.body?.userRequest?.user?.id ||
      req.body?.userId ||
      'test-user';

    const text = String(
      req.body?.userRequest?.utterance ||
      req.body?.message ||
      ''
    ).trim();

    logger.info(`[${userId}] message: "${text}"`);

    if (text === '0') {
      const session = getSession(userId);
      const wasOrderComplete = session.state === 'READY_TO_ORDER';
      resetSession(userId, wasOrderComplete);
      const msg = wasOrderComplete ? welcomeMessage() : mainMenuMessage();
      return res.json(kakaoResponse(msg));
    }

    if (!text) {
      const session = getSession(userId);
      if (session.isFirstVisit) {
        updateSession(userId, { isFirstVisit: false });
        return res.json(kakaoResponse(welcomeMessage()));
      }
      return res.json(kakaoResponse(mainMenuMessage()));
    }

    const session = getSession(userId);
    logger.info(`[${userId}] state: ${session.state}`);

    if (session.state === 'MAIN') {
      if (session.isFirstVisit) {
        updateSession(userId, { isFirstVisit: false });
        return res.json(kakaoResponse(welcomeMessage()));
      }
      if (text === '1') {
        const region1List = await listRegion1();
        updateSession(userId, { state: 'SELECT_REGION_1' });
        return res.json(kakaoResponse(formatNumberedList('주문하실 지역을 선택해주세요.', region1List)));
      }
      if (text === '2') {
        const categories = await listCategories();
        updateSession(userId, { state: 'SELECT_MENU_CATEGORY' });
        return res.json(kakaoResponse(formatNumberedList('금주 메뉴 카테고리를 선택해주세요.', categories)));
      }
      if (text === '3') {
        return res.json(kakaoResponse(helpMessage()));
      }
      if (text === '4') {
        return res.json(kakaoResponse('상담 연결 중입니다.\n카카오톡 채널 채팅으로 문의해주세요.'));
      }
      return res.json(kakaoResponse(mainMenuMessage()));
    }

    if (session.state === 'SELECT_REGION_1') {
      const region1List = await listRegion1();
      const selectedRegion1 = region1List[Number(text) - 1];
      if (!selectedRegion1) return res.json(kakaoResponse('올바른 번호를 입력해주세요.'));
      const region2List = await listRegion2(selectedRegion1);
      updateSession(userId, { state: 'SELECT_REGION_2', region1: selectedRegion1 });
      return res.json(kakaoResponse(formatNumberedList(`${selectedRegion1} 내 상세 지역을 선택해주세요.`, region2List)));
    }

    if (session.state === 'SELECT_REGION_2') {
      const region2List = await listRegion2(session.region1);
      const selectedRegion2 = region2List[Number(text) - 1];
      if (!selectedRegion2) return res.json(kakaoResponse('올바른 번호를 입력해주세요.'));
      updateSession(userId, { state: 'INPUT_APARTMENT', region2: selectedRegion2 });
      return res.json(kakaoResponse(
        [`${session.region1} ${selectedRegion2} 선택됨`, '', '아파트 또는 건물명을 입력해주세요.', '예: 만현마을5단지 / 신봉마을LG빌리지 / 상가건물', '', '0. 처음으로'].join('\n')
      ));
    }

    if (session.state === 'INPUT_APARTMENT') {
      const categories = await listCategories();
      updateSession(userId, { state: 'SELECT_MENU_CATEGORY', apartmentName: text });
      return res.json(kakaoResponse(formatNumberedList('메뉴 카테고리를 선택해주세요.', categories)));
    }

    if (session.state === 'SELECT_MENU_CATEGORY') {
      const categories = await listCategories();
      const selectedCategory = categories[Number(text) - 1];
      if (!selectedCategory) return res.json(kakaoResponse('올바른 번호를 입력해주세요.'));
      const days = await listDaysByCategory(selectedCategory);
      updateSession(userId, { state: 'SELECT_DAY', selectedCategory });
      return res.json(kakaoResponse(formatNumberedList('주문하실 요일을 선택해주세요.', days)));
    }

    if (session.state === 'SELECT_DAY') {
      const days = await listDaysByCategory(session.selectedCategory);
      const selectedDay = days[Number(text) - 1];
      if (!selectedDay) return res.json(kakaoResponse('올바른 번호를 입력해주세요.'));
      const menu = await getMenuDetail(session.selectedCategory, selectedDay);
      if (!menu) return res.json(kakaoResponse('해당 요일 메뉴가 없습니다.'));
      updateSession(userId, { state: 'VIEW_MENU_DETAIL', selectedDay, selectedMenuId: menu.menu_id });
      return res.json(kakaoResponse(menuDetailMessage(menu)));
    }

    if (session.state === 'VIEW_MENU_DETAIL') {
      const menu = await getMenuDetail(session.selectedCategory, session.selectedDay);
      if (!menu) return res.json(kakaoResponse('메뉴를 찾을 수 없습니다.'));
      if (text === '1') return res.json(kakaoResponse(menu.flyer_url ? `📸 카드뉴스\n${menu.flyer_url}` : '카드뉴스가 아직 준비되지 않았습니다.'));
      if (text === '2') return res.json(kakaoResponse(menu.shorts_url ? `🎬 Shorts\n${menu.shorts_url}` : 'Shorts가 아직 준비되지 않았습니다.'));
      if (text === '3') {
        const formUrl = buildOrderFormUrl({
          region1: session.region1,
          region2: session.region2,
          apartmentName: session.apartmentName,
          menuName: menu.menu_name,
          day: menu.day,
        });
        updateSession(userId, { state: 'READY_TO_ORDER' });
        return res.json(kakaoResponse(orderConfirmMessage(session, formUrl)));
      }
      return res.json(kakaoResponse('올바른 번호를 입력해주세요.'));
    }

    if (session.state === 'READY_TO_ORDER') {
      return res.json(kakaoResponse(['주문서 링크는 위에서 확인해주세요.', '', '0. 처음으로 돌아가기'].join('\n')));
    }

    return res.json(kakaoResponse(mainMenuMessage()));

  } catch (error) {
    logger.error('handleWebhook error:', error);
    return res.status(500).json(kakaoResponse('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'));
  }
}

module.exports = { handleWebhook };
