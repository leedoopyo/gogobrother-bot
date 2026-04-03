const { env } = require('../config/env');

function buildOrderFormUrl({ region1, region2, apartmentName, menuName, day }) {
  const url = new URL(env.BASE_FORM_URL);

  url.searchParams.append(env.FORM_REGION1_ENTRY, region1 || '');
  url.searchParams.append(env.FORM_REGION2_ENTRY, region2 || '');
  url.searchParams.append(env.FORM_APARTMENT_ENTRY, apartmentName || '');
  url.searchParams.append(env.FORM_MENU_ENTRY, menuName || '');
  url.searchParams.append(env.FORM_DAY_ENTRY, day || '');

  return url.toString();
}

module.exports = { buildOrderFormUrl };
