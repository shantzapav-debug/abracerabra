import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCatalog } from '../context/CatalogContext';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';

export default function Home() {
  const { t } = useLanguage();
  const { company, categories, products, categoryCount, loading } = useCatalog();
  const featured = products.slice(0, 8);
  const capabilityKeys = [
    'company.capability.advanced',
    'company.capability.moq',
    'company.capability.packaging',
    'company.capability.ceramics',
  ];
  if (loading) return <div className="loading">{t('loading')}</div>;

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <div className="hero-eyebrow">{t('hero.eyebrow')}</div>
            <h1>{t('company.tagline')}</h1>
            <p className="hero-lead">{t('company.about')}</p>
            <div className="hero-actions">
              <Link to="/catalog" className="btn btn-primary btn-lg">
                {t('hero.cta.catalog')}
              </Link>
              <Link
                to="/rfq-cart"
                className="btn btn-outline btn-lg"
                style={{
                  background: 'transparent',
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.35)',
                }}
              >
                {t('hero.cta.rfq')}
              </Link>
            </div>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <strong>{products.length}</strong>
              <span>{t('skus')}</span>
            </div>
            <div className="stat-card">
              <strong>{categories.length}</strong>
              <span>{t('categories')}</span>
            </div>
            <div className="stat-card">
              <strong>{company?.established}</strong>
              <span>{t('established')}</span>
            </div>
            <div className="stat-card">
              <strong>Export</strong>
              <span>USA · JP · EU · MENA</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-grid">
            <div className="card">
              <h3>{t('about.title')}</h3>
              <p>{t('company.about')}</p>
              <div className="meta-pills">
                <span className="pill">{company?.nature}</span>
                <span className="pill">{company?.location}</span>
                <span className="pill">{company?.employees}</span>
                <span className="pill">GST {company?.gst}</span>
              </div>
            </div>
            <div className="card">
              <h3>{t('cap.title')}</h3>
              <ul className="cap-list">
                {capabilityKeys.map((key) => (
                  <li key={key} className="cap-item">
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{t('cat.title')}</h2>
            </div>
            <Link to="/catalog" className="link-more">
              {t('cat.view')}
            </Link>
          </div>
          <div className="cat-grid">
            {categories.map((c) => (
              <CategoryCard key={c.id} category={c} count={categoryCount(c.id)} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{t('feat.title')}</h2>
              <p>{t('feat.sub')}</p>
            </div>
            <Link to="/catalog" className="link-more">
              {t('cat.view')}
            </Link>
          </div>
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
