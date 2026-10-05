import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCatalog } from '../context/CatalogContext';

export default function Footer() {
  const { t } = useLanguage();
  const { company } = useCatalog();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="logo logo-sm">
            <span className="logo-mark">A</span>
            <span className="logo-text">
              <strong>Abracerabra</strong>
            </span>
          </div>
          <p className="footer-tagline">{t('company.tagline')}</p>
        </div>
        <div className="footer-meta">
          <h4>{t('footer.company')}</h4>
          <ul>
            <li>
              <span>{t('footer.location')}</span>{' '}
              <strong>{company?.location || 'Bengaluru, India'}</strong>
            </li>
            <li>
              <span>GST:</span> <strong>{company?.gst}</strong>
            </li>
            <li>
              <span>IEC:</span> <strong>{company?.iec}</strong>
            </li>
            <li>
              <span>{t('footer.established')}</span>{' '}
              <strong>{company?.established}</strong>
            </li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>{t('footer.quick')}</h4>
          <ul>
            <li>
              <Link to="/catalog">{t('nav.catalog')}</Link>
            </li>
            <li>
              <Link to="/rfq-cart">{t('nav.rfq')}</Link>
            </li>
          </ul>
          <p className="footer-disclaimer">{t('footer.disclaimer')}</p>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <span>
            © {new Date().getFullYear()} Abracerabra. Indicative pricing — no online payment.
          </span>
        </div>
      </div>
    </footer>
  );
}
