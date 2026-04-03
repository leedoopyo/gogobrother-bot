function formatNumberedList(title, items) {
  const lines = [title, ''];
  items.forEach((item, idx) => {
    lines.push(`${idx + 1}. ${item}`);
  });
  lines.push('');
  lines.push('0. 처음으로');
  return lines.join('\n');
}

function mainMenuMessage() {
  return [
    '안녕하세요. 고고브라더입니다.',
    '',
    '1. 주문 시작',
    '2. 금주 진행 메뉴',
    '3. 주문 방법',
    '4. 상담 연결',
  ].join('\n');
}

function helpMessage() {
  return [
    '📋 이용 방법',
    '',
    '1을 누르면 주문을 시작합니다.',
    '지역 → 동 → 아파트 → 메뉴 순서로 선택합니다.',
    '0을 누르면 언제든지 처음으로 돌아갑니다.',
  ].join('\n');
}

function menuDetailMessage(menu) {
  return [
    `[${menu.day}요일 메뉴]`,
    menu.menu_name,
    '',
    `설명: ${menu.description}`,
    `배달/픽업 시간: ${menu.delivery_time}`,
    '',
    '1. 카드뉴스 보기',
    '2. Shorts 보기',
    '3. 주문하기',
    '0. 처음으로',
  ].join('\n');
}

function orderConfirmMessage(session, formUrl) {
  return [
    '✅ 주문서 링크가 생성되었습니다.',
    '',
    `지역: ${session.region1} ${session.region2}`,
    `아파트/건물명: ${session.apartmentName}`,
    `메뉴: ${session.selectedDay}요일 메뉴`,
    '',
    '아래 링크에서 주문을 완료해주세요.',
    formUrl,
    '',
    '0. 처음으로',
  ].join('\n');
}

module.exports = {
  formatNumberedList,
  mainMenuMessage,
  helpMessage,
  menuDetailMessage,
  orderConfirmMessage,
};
