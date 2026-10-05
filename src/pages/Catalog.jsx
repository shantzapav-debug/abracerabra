import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCatalog } from '../context/CatalogContext';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';

export default function Catalog() {
  const { t } = useLanguage();
  const { categories, products, categoryCount, loading } = useCatalog();

  if (loading) return <div className="loading">{t('loading')}</div>;

  return (
    <>
      <div className="container page-head">
        <nav className="breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <span className="sep">/</span>
          <span>{t('nav.catalog')}</span>
        </nav>
        <h1>{t('cat.title')}</h1>
        <p className="sub">
          {t('catalog.stats', {
            products: products.length,
            categories: categories.length,
            indicative: t('price.indicative'),
          })}
        </p>
      </div>
      <section className="section" style={{ paddingTop: '1.5rem' }}>
        <div className="container">
          <div className="cat-grid" style={{ marginBottom: '2rem' }}>
            {categories.map((c) => (
              <CategoryCard key={c.id} category={c} count={categoryCount(c.id)} />
            ))}
          </div>
          <div className="section-header">
            <div>
              <h2>{t('all.products')}</h2>
            </div>
          </div>
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
