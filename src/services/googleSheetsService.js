const { sheets } = require('../config/google');
const { env } = require('../config/env');

async function getSheetValues(range) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEETS_ID,
    range,
  });

  return response.data.values || [];
}

module.exports = { getSheetValues };
