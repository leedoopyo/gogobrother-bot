const { getSession, updateSession, resetSession } = require('../services/sessionService');
const { listRegion1, listRegion2 } = require('../services/regionService');
const { listCategories, listDaysByCategory, getMenuDetail } = require('../services/menuService');
const { buildOrderFormUrl } = require('../services/formService');
const {
  formatNumberedList,
  mainMenuMessage,
  helpMessage,
  menuDetailMessage,
  orderConfirmMessage,
} = require('../services/messageService');
const logger = require('../utils/logger');

async function handleWebhook(req, res) {
  try {
    const userId = req.body.userId || 'test-user';
    const text = String(req.body.message || '').trim();

    logger.info(`[${userId}] message: "${text}"`);

    // 초기화
    if (!text || text === '0') {
      resetSession(userId);
      return res.json({ reply: mainMenuMessage() });
    }

    const session = getSession(userId);
    logger.info(`[${userId}] state: ${session.state}`);

    // ── MAIN ──────────────────────────────────────────
    if (session.state === 'MAIN') {
      if (text === '1') {
        const region1List = await listRegion1();
        updateSession(userId, { state: 'SELECT_REGION_1' });
        return res.json({
          reply: formatNumberedList('주문하실 지역을 선택해주세요.', region1List),
        });
      }

      if (text === '2') {
        // 카테고리 목록 보여주기
        const categories = await listCategories();
        updateSession(userId, { state: 'SELECT_MENU_CATEGORY' });
        return res.json({
          reply: formatNumberedList('금주 메뉴 카테고리를 선택해주세요.', categories),
        });
      }

      if (text === '3') {
        return res.json({ reply: helpMessage() });
      }

      if (text === '4') {
        return res.json({
          reply: '상담 연결 중입니다.\n카카오톡 채널 채팅으로 문의해주세요.',
        });
      }

      return res.json({ reply: mainMenuMessage() });
    }

    // ── SELECT_REGION_1 ───────────────────────────────
    if (session.state === 'SELECT_REGION_1') {
      const region1List = await listRegion1();
      const selectedRegion1 = region1List[Number(text) - 1];

      if (!selectedRegion1) {
        return res.json({ reply: '올바른 번호를 입력해주세요.' });
      }

      const region2List = await listRegion2(selectedRegion1);
      updateSession(userId, { state: 'SELECT_REGION_2', region1: selectedRegion1 });

      return res.json({
        reply: formatNumberedList(
          `${selectedRegion1} 내 상세 지역을 선택해주세요.`,
          region2List
        ),
      });
    }

    // ── SELECT_REGION_2 ───────────────────────────────
    if (session.state === 'SELECT_REGION_2') {
      const region2List = await listRegion2(session.region1);
      const selectedRegion2 = region2List[Number(text) - 1];

      if (!selectedRegion2) {
        return res.json({ reply: '올바른 번호를 입력해주세요.' });
      }

      updateSession(userId, { state: 'INPUT_APARTMENT', region2: selectedRegion2 });

      return res.json({
        reply: [
          `${session.region1} ${selectedRegion2} 선택됨`,
          '',
          '아파트 또는 건물명을 입력해주세요.',
          '예: 만현마을5단지 / 신봉마을LG빌리지 / 상가건물',
          '',
          '0. 처음으로',
        ].join('\n'),
      });
    }

    // ── INPUT_APARTMENT ───────────────────────────────
    if (session.state === 'INPUT_APARTMENT') {
      const categories = await listCategories();

      updateSession(userId, {
        state: 'SELECT_MENU_CATEGORY',
        apartmentName: text,
      });

      return res.json({
        reply: formatNumberedList('메뉴 카테고리를 선택해주세요.', categories),
      });
    }

    // ── SELECT_MENU_CATEGORY ──────────────────────────
    if (session.state === 'SELECT_MENU_CATEGORY') {
      const categories = await listCategories();
      const selectedCategory = categories[Number(text) - 1];

      if (!selectedCategory) {
        return res.json({ reply: '올바른 번호를 입력해주세요.' });
      }

      const days = await listDaysByCategory(selectedCategory);
      updateSession(userId, { state: 'SELECT_DAY', selectedCategory });

      return res.json({
        reply: formatNumberedList('주문하실 요일을 선택해주세요.', days),
      });
    }

    // ── SELECT_DAY ────────────────────────────────────
    if (session.state === 'SELECT_DAY') {
      const days = await listDaysByCategory(session.selectedCategory);
      const selectedDay = days[Number(text) - 1];

      if (!selectedDay) {
        return res.json({ reply: '올바른 번호를 입력해주세요.' });
      }

      const menu = await getMenuDetail(session.selectedCategory, selectedDay);

      if (!menu) {
        return res.json({ reply: '해당 요일 메뉴가 없습니다.' });
      }

      updateSession(userId, {
        state: 'VIEW_MENU_DETAIL',
        selectedDay,
        selectedMenuId: menu.menu_id,
      });

      return res.json({ reply: menuDetailMessage(menu) });
    }

    // ── VIEW_MENU_DETAIL ──────────────────────────────
    if (session.state === 'VIEW_MENU_DETAIL') {
      const menu = await getMenuDetail(session.selectedCategory, session.selectedDay);

      if (!menu) {
        return res.json({ reply: '메뉴를 찾을 수 없습니다.' });
      }

      if (text === '1') {
        return res.json({
          reply: menu.flyer_url
            ? `📸 카드뉴스\n${menu.flyer_url}`
            : '카드뉴스가 아직 준비되지 않았습니다.',
        });
      }

      if (text === '2') {
        return res.json({
          reply: menu.shorts_url
            ? `🎬 Shorts\n${menu.shorts_url}`
            : 'Shorts가 아직 준비되지 않았습니다.',
        });
      }

      if (text === '3') {
        const formUrl = buildOrderFormUrl({
          region1: session.region1,
          region2: session.region2,
          apartmentName: session.apartmentName,
          menuName: menu.menu_name,
          day: menu.day,
        });

        updateSession(userId, { state: 'READY_TO_ORDER' });

        return res.json({
          reply: orderConfirmMessage(session, formUrl),
        });
      }

      return res.json({ reply: '올바른 번호를 입력해주세요.' });
    }

    // ── READY_TO_ORDER ────────────────────────────────
    if (session.state === 'READY_TO_ORDER') {
      return res.json({
        reply: [
          '주문서 링크는 위에서 확인해주세요.',
          '',
          '0. 처음으로',
        ].join('\n'),
      });
    }

    return res.json({ reply: mainMenuMessage() });

  } catch (error) {
    logger.error('handleWebhook error:', error);
    return res.status(500).json({
      reply: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      detail: error.message,
    });
  }
}

module.exports = { handleWebhook };
