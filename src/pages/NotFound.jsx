import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="container page-head">
      <h1>{t('not.found.page')}</h1>
      <p className="sub">
        <Link to="/">{t('nav.home')}</Link>
      </p>
    </div>
  );
}
