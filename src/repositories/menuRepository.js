const { getSheetValues } = require('../services/googleSheetsService');
const { rowsToObjects } = require('../utils/helpers');

async function getActiveMenus() {
  const rows = await getSheetValues('weekly_menu!A:L');
  return rowsToObjects(rows)
    .filter((r) => r.active === 'Y')
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
}

async function getCategories() {
  const menus = await getActiveMenus();
  const seen = new Set();
  return menus
    .map((m) => m.category)
    .filter((c) => {
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    });
}

async function getMenusByCategory(category) {
  const menus = await getActiveMenus();
  return menus.filter((m) => m.category === category);
}

async function getMenuByDay(category, day) {
  const menus = await getMenusByCategory(category);
  return menus.find((m) => m.day === day) || null;
}

module.exports = {
  getActiveMenus,
  getCategories,
  getMenusByCategory,
  getMenuByDay,
};
