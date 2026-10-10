import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useLanguage } from '../context/LanguageContext';

const LANGS = [
  { code: 'en', title: 'English' },
  { code: 'ja', title: '日本語' },
  { code: 'fr', title: 'Français' },
  { code: 'ar', title: 'العربية' },
];

export default function Layout() {
  const { t, lang, setLang } = useLanguage();

  return (
    <>
      <div className="top-banner" role="status">
        <span className="banner-note">{t('banner')}</span>
        <div className="lang-toggle" role="group" aria-label="Language">
          {LANGS.map((item) => (
            <button
              key={item.code}
              type="button"
              className={`lang-btn${lang === item.code ? ' active' : ''}`}
              title={item.title}
              onClick={() => setLang(item.code)}
            >
              {item.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
