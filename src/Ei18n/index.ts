import path from 'path';

const i18n = require('i18n');

i18n.configure({
  defaultLocale: 'vi',
  locales: ['en', 'vi'],
  directory: path.join(__dirname, 'locales'),
  autoReload: true,
  updateFiles: false,
  objectNotation: true,
});

export default i18n;
