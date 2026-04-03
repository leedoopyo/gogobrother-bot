const { getSheetValues } = require('../services/googleSheetsService');
const { rowsToObjects } = require('../utils/helpers');

async function getRegion1List() {
  const rows = await getSheetValues('region_master!A:D');
  const items = rowsToObjects(rows).filter((r) => r.active === 'Y');

  // 중복 제거 + sort_order 기준 정렬
  const seen = new Set();
  const result = [];

  items
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    .forEach((item) => {
      if (!seen.has(item.region1)) {
        seen.add(item.region1);
        result.push(item.region1);
      }
    });

  return result;
}

async function getRegion2List(region1) {
  const rows = await getSheetValues('region_master!A:D');
  const items = rowsToObjects(rows).filter(
    (r) => r.active === 'Y' && r.region1 === region1
  );

  return items
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    .map((r) => r.region2);
}

module.exports = { getRegion1List, getRegion2List };
