const {
  getCategories,
  getMenusByCategory,
  getMenuByDay,
} = require('../repositories/menuRepository');

async function listCategories() {
  return getCategories();
}

async function listDaysByCategory(category) {
  const menus = await getMenusByCategory(category);
  return menus.map((m) => m.day);
}

async function getMenuDetail(category, day) {
  return getMenuByDay(category, day);
}

module.exports = { listCategories, listDaysByCategory, getMenuDetail };
