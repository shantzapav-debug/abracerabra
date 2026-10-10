import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCatalog } from '../context/CatalogContext';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';

export default function Catalog() {
  const { t } = useLanguage();
  const { categories, products, categoryCount, loading } = useCatalog();

  if (loading) return <div className="loading">{t('loading')}</div>;

  const imageFor = (categoryId) =>
    products.find((product) => product.category === categoryId && product.image)?.image;

  return (
    <>
      <div className="page-head">
        <div className="container">
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
      </div>
      <section className="section" style={{ paddingTop: '2rem' }}>
        <div className="container">
          <div className="cat-grid" style={{ marginBottom: '2.5rem' }}>
            {categories.map((c) => (
              <CategoryCard
                key={c.id}
                category={c}
                count={categoryCount(c.id)}
                image={imageFor(c.id)}
              />
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
