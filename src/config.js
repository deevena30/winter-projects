const config = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  siteTitle: process.env.REACT_APP_SITE_TITLE || 'Winter Projects',
  googleSheetsUrl: process.env.REACT_APP_GOOGLE_SHEETS_URL,
};

export default config;