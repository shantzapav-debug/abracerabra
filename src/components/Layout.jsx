import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useLanguage } from '../context/LanguageContext';

export default function Layout() {
  const { t } = useLanguage();

  return (
    <>
      <div className="top-banner" role="status">
        <span className="banner-icon" aria-hidden="true">ℹ</span>
        <span>{t('banner')}</span>
      </div>
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
