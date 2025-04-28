import { I18n } from 'i18n';
import path from 'path';

const i18nClient = new I18n({
  defaultLocale: 'vi',
  locales: ['en', 'vi'],
  directory: path.join(__dirname, 'locales'),
  autoReload: true,
  syncFiles: false,
});

export default i18nClient;
