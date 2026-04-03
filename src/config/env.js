require('dotenv').config();

const env = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID,
  GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : '',

  BASE_FORM_URL: process.env.BASE_FORM_URL,
  FORM_REGION1_ENTRY: process.env.FORM_REGION1_ENTRY,
  FORM_REGION2_ENTRY: process.env.FORM_REGION2_ENTRY,
  FORM_APARTMENT_ENTRY: process.env.FORM_APARTMENT_ENTRY,
  FORM_MENU_ENTRY: process.env.FORM_MENU_ENTRY,
  FORM_DAY_ENTRY: process.env.FORM_DAY_ENTRY,
};

module.exports = { env };
