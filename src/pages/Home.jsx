import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCatalog } from '../context/CatalogContext';
import ProductCard from '../components/ProductCard';

const FAMILIES = [
  { key: 'grinding', ids: ['grinding-wheel'], titleKey: null, blurbKey: 'cat.band.grinding' },
  { key: 'honing', ids: ['honing-stone', 'honing-stick'], titleKey: 'cat.group.honing', blurbKey: 'cat.band.honing' },
  { key: 'cutting', ids: ['cutting-wheel', 'cutting-disc'], titleKey: 'cat.group.cutting', blurbKey: 'cat.band.cutting' },
  { key: 'specialties', ids: ['specialties'], titleKey: null, blurbKey: 'cat.band.specialties' },
];

const MARKETS = [
  { id: 'rail', titleKey: 'market.rail.title', bodyKey: 'market.rail.body', productId: 'gw-rail-100', category: 'grinding-wheel' },
  { id: 'metal', titleKey: 'market.metal.title', bodyKey: 'market.metal.body', productId: 'gw-bench', category: 'grinding-wheel' },
  { id: 'finish', titleKey: 'market.finish.title', bodyKey: 'market.finish.body', productId: 'hs-abrasive', category: 'honing-stone' },
  { id: 'ceramic', titleKey: 'market.ceramic.title', bodyKey: 'market.ceramic.body', category: 'specialties' },
];

const CAPABILITIES = [
  'company.capability.sic',
  'company.capability.alumina',
  'company.capability.zirconia',
  'company.capability.export',
];

export default function Home() {
  const { t } = useLanguage();
  const { hash } = useLocation();
  const { company, categories, products, categoryCount, loading } = useCatalog();
  const featured = products.slice(0, 4);
  const heroImage = products.find((product) => product.image)?.image;

  useEffect(() => {
    if (!hash || loading) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash, loading]);

  if (loading) return <div className="loading">{t('loading')}</div>;

  const families = FAMILIES.map((family) => {
    const cats = family.ids
      .map((id) => categories.find((category) => category.id === id))
      .filter(Boolean);
    if (!cats.length) return null;
    const sample = products.find((product) => family.ids.includes(product.category) && product.image);
    return { ...family, cats, sample };
  }).filter(Boolean);

  const productImage = (id) => products.find((product) => product.id === id)?.image;
  const categoryImage = (id) => products.find((product) => product.category === id && product.image)?.image;

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
              {t('cat.viewProducts')}
            </Link>
            <Link to="/rfq-cart" className="btn btn-hero-secondary btn-lg">
              {t('nav.request')}
            </Link>
          </div>
        </div>
      </section>

      <section className="section intro-section">
        <div className="container intro-grid">
          <div>
            <p className="kicker">{t('cap.kicker')}</p>
            <h2>{t('home.solution')}</h2>
          </div>
          <p className="intro-copy">{t('cap.intro.body')}</p>
        </div>
      </section>

      <section className="family-section" aria-label={t('nav.products')}>
        <div className="container">
          <div className="family-grid">
            {families.map((family) => (
              <article className="family-card" key={family.key}>
                {family.sample ? (
                  <img src={family.sample.image} alt="" />
                ) : (
                  <div className="placeholder" />
                )}
                <div className="family-card-body">
                  <h2>{family.titleKey ? t(family.titleKey) : family.cats[0].name}</h2>
                  <p>{t(family.blurbKey)}</p>
                  <div className="family-links">
                    {family.cats.map((category) => (
                      <Link key={category.id} to={`/category/${category.id}`}>
                        {category.name}
                        <span>{categoryCount(category.id)}</span>
                      </Link>
                    ))}
                  </div>
                  <Link to={`/category/${family.cats[0].id}`} className="link-more">
                    {t('cat.viewProducts')}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
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
                <span className="pill">{t('footer.established')} {company?.established}</span>
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

      <section className="section markets-section" id="markets">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="kicker">{t('nav.markets')}</p>
              <h2>{t('home.markets.title')}</h2>
              <p>{t('home.markets.lead')}</p>
            </div>
          </div>
          <div className="market-grid">
            {MARKETS.map((market) => {
              const image = productImage(market.productId) || categoryImage(market.category);
              return (
                <Link
                  className="market-card"
                  id={`market-${market.id}`}
                  key={market.id}
                  to={`/category/${market.category}`}
                >
                  {image && <img src={image} alt="" />}
                  <div className="market-card-copy">
                    <h3>{t(market.titleKey)}</h3>
                    <p>{t(market.bodyKey)}</p>
                  </div>
                </Link>
              );
            })}
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
          <p className="cta-meta">
            {company?.location} · {t('footer.established')} {company?.established}
          </p>
          <Link to="/rfq-cart" className="btn btn-light btn-lg">
            {t('cta.button')}
          </Link>
        </div>
      </section>
    </>
  );
}
