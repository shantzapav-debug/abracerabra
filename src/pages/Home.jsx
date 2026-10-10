import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCatalog } from '../context/CatalogContext';
import ProductCard from '../components/ProductCard';

const BANDS = [
  { key: 'grinding', ids: ['grinding-wheel'], titleKey: null, blurbKey: 'cat.band.grinding' },
  { key: 'honing', ids: ['honing-stone', 'honing-stick'], titleKey: 'cat.group.honing', blurbKey: 'cat.band.honing' },
  { key: 'cutting', ids: ['cutting-wheel', 'cutting-disc'], titleKey: 'cat.group.cutting', blurbKey: 'cat.band.cutting' },
  { key: 'specialties', ids: ['specialties'], titleKey: null, blurbKey: 'cat.band.specialties' },
];

const CAPABILITIES = [
  'company.capability.sic',
  'company.capability.alumina',
  'company.capability.zirconia',
  'company.capability.export',
];

export default function Home() {
  const { t } = useLanguage();
  const { company, categories, products, categoryCount, loading } = useCatalog();
  const featured = products.slice(0, 4);
  const heroImage = products.find((product) => product.image)?.image;

  if (loading) return <div className="loading">{t('loading')}</div>;

  const bands = BANDS.map((band) => {
    const cats = band.ids
      .map((id) => categories.find((category) => category.id === id))
      .filter(Boolean);
    if (!cats.length) return null;
    const sample = products.find((product) => band.ids.includes(product.category) && product.image);
    const count = band.ids.reduce((sum, id) => sum + categoryCount(id), 0);
    return { ...band, cats, sample, count };
  }).filter(Boolean);

  return (
    <>
      <section className="hero">
        {heroImage && (
          <div className="hero-bg" aria-hidden="true">
            <img src={heroImage} alt="" />
          </div>
        )}
        <div className="container hero-inner">
          <p className="hero-eyebrow">{t('hero.eyebrow')}</p>
          <h1>{t('hero.headline')}</h1>
          <p className="hero-lead">{t('hero.lead')}</p>
          <div className="hero-actions">
            <Link to="/catalog" className="btn btn-light btn-lg">
              {t('hero.cta.catalog')}
            </Link>
            <Link to="/rfq-cart" className="btn btn-hero-secondary btn-lg">
              {t('nav.request')}
            </Link>
          </div>
        </div>
      </section>

      <section className="stats-bar" aria-label={t('cap.title')}>
        <div className="container stats-grid">
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
            <strong>{t('stat.export')}</strong>
            <span>{t('stat.regions')}</span>
          </div>
        </div>
      </section>

      <section className="section intro-section">
        <div className="container intro-grid">
          <div>
            <p className="kicker">{t('cap.kicker')}</p>
            <h2>{t('cap.intro.title')}</h2>
          </div>
          <p className="intro-copy">{t('cap.intro.body')}</p>
        </div>
      </section>

      <section className="bands">
        {bands.map((band, index) => (
          <article className={`band${index % 2 ? ' reverse' : ''}`} key={band.key}>
            <div className="band-media">
              {band.sample ? (
                <img src={band.sample.image} alt="" />
              ) : (
                <div className="placeholder" />
              )}
            </div>
            <div className="band-copy">
              <p className="kicker">{t('nav.products')}</p>
              <h2>{band.titleKey ? t(band.titleKey) : band.cats[0].name}</h2>
              <p>{t(band.blurbKey)}</p>
              {band.cats.length > 1 && (
                <div className="band-links">
                  {band.cats.map((category) => (
                    <Link key={category.id} to={`/category/${category.id}`}>
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
              <div className="band-actions">
                <Link to={`/category/${band.cats[0].id}`} className="btn btn-primary">
                  {t('cat.viewProducts')}
                </Link>
                <span className="band-count">
                  {band.count} {t('products')}
                </span>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="section about-section">
        <div className="container">
          <div className="about-layout">
            <div>
              <p className="kicker">{t('about.title')}</p>
              <h2>{t('company.tagline')}</h2>
            </div>
            <div className="about-copy">
              <p>{t('company.about')}</p>
              <p>{t('company.about.p2')}</p>
              <div className="meta-pills">
                <span className="pill">{company?.nature}</span>
                <span className="pill">{company?.location}</span>
                <span className="pill">{company?.employees}</span>
                <span className="pill">GST {company?.gst}</span>
              </div>
            </div>
          </div>
          <div className="cap-grid">
            {CAPABILITIES.map((key) => (
              <div className="cap-tile" key={key}>
                <h3>{t(key)}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section featured-section">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="kicker">{t('nav.catalog')}</p>
              <h2>{t('feat.title')}</h2>
              <p>{t('feat.sub')}</p>
            </div>
            <Link to="/catalog" className="link-more">
              {t('cat.view')}
            </Link>
          </div>
          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-inner">
          <p className="kicker">{t('cta.kicker')}</p>
          <h2>{t('cta.title')}</h2>
          <p>{t('cta.body')}</p>
          <Link to="/rfq-cart" className="btn btn-light btn-lg">
            {t('cta.button')}
          </Link>
        </div>
      </section>
    </>
  );
}
