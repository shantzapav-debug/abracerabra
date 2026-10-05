import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCatalog } from '../context/CatalogContext';
import ProductCard from '../components/ProductCard';

export default function Category() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { categoryById, productsByCategory, loading } = useCatalog();

  if (loading) return <div className="loading">{t('loading')}</div>;

  const cat = categoryById(id);
  if (!cat) {
    return (
      <div className="container page-head">
        <h1>{t('not.found.cat')}</h1>
        <p className="sub">
          <Link to="/catalog">{t('nav.catalog')}</Link>
        </p>
      </div>
    );
  }

  const products = productsByCategory(id);

  return (
    <>
      <div className="container page-head">
        <nav className="breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <span className="sep">/</span>
          <Link to="/catalog">{t('nav.catalog')}</Link>
          <span className="sep">/</span>
          <span>{cat.name}</span>
        </nav>
        <h1>{cat.name}</h1>
        <p className="sub">
          {products.length} products · {cat.prdName || cat.name}
        </p>
      </div>
      <section className="section" style={{ paddingTop: '1.5rem' }}>
        <div className="container">
          <div className="product-grid">
            {products.length ? (
              products.map((p) => <ProductCard key={p.id} product={p} />)
            ) : (
              <p>No products in this category.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
