import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCatalog } from '../context/CatalogContext';
import ProductCard from '../components/ProductCard';

function useHeroProgress(ref, enabled) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const node = ref.current;
      if (!node) return;
      const distance = node.offsetHeight - window.innerHeight;
      if (distance <= 0) {
        setProgress(0);
        return;
      }
      const traveled = Math.min(Math.max(-node.getBoundingClientRect().top, 0), distance);
      setProgress(traveled / distance);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, enabled]);

  return progress;
}

function Reveal({ className, children }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setShown(true);
      observer.disconnect();
    }, { threshold: 0.28 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${className}${shown ? ' is-in' : ''}`}>
      {children}
    </div>
  );
}

const FAMILIES = [
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
  const heroRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const heroImages = [];
  const seenCategories = new Set();
  for (const product of products) {
    if (!product.image || seenCategories.has(product.category)) continue;
    seenCategories.add(product.category);
    heroImages.push(product.image);
    if (heroImages.length === 4) break;
  }
  const heroProgress = useHeroProgress(heroRef, !loading && !reduceMotion && heroImages.length > 1);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  if (loading) return <div className="loading">{t('loading')}</div>;

  const families = FAMILIES.map((family) => {
    const cats = family.ids
      .map((id) => categories.find((category) => category.id === id))
      .filter(Boolean);
    if (!cats.length) return null;
    const sample = products.find((product) => family.ids.includes(product.category) && product.image);
    return { ...family, cats, sample };
  }).filter(Boolean);

  return (
    <>
      <section
        className={`hero-scroll${reduceMotion ? ' is-static' : ''}`}
        ref={heroRef}
      >
      <div className="hero">
        {heroImages.length > 0 && (
          <div className="hero-bg" aria-hidden="true">
            {heroImages.map((src, index) => {
              const span = Math.max(heroImages.length - 1, 1);
              const opacity = reduceMotion || heroImages.length === 1
                ? (index === 0 ? 1 : 0)
                : Math.max(0, 1 - Math.abs(heroProgress * span - index));
              const shift = reduceMotion ? 0 : (index - heroProgress * span) * 10;
              return (
                <img
                  key={`${src}-${index}`}
                  src={src}
                  alt=""
                  style={{ opacity, transform: `translate3d(0, ${shift}%, 0)` }}
                />
              );
            })}
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
      </div>
      </section>

      <section className="section intro-section">
        <div className="container">
          <Reveal className="intro-grid">
            <div className="intro-title">
              <p className="kicker">{t('cap.kicker')}</p>
              <h2>{t('home.solution')}</h2>
            </div>
            <p className="intro-copy">{t('cap.intro.body')}</p>
          </Reveal>
        </div>
      </section>

      <section className="family-section" aria-label={t('nav.products')}>
        <div className="container">
          <Reveal className="family-grid reveal-photos">
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
          </Reveal>
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
          <Reveal className="product-grid reveal-photos">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Reveal>
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
