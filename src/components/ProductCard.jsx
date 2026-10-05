import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';
import { formatPrice } from '../utils';
import ProductImage from './ProductImage';

export default function ProductCard({ product }) {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { categoryById } = useCatalog();
  const cat = categoryById(product.category);

  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-img">
        <ProductImage src={product.image} alt={product.name} />
        <span className="price-badge">
          {formatPrice(product.indicativePrice, product.currency)}
          <em>{t('price.indicative')}</em>
        </span>
      </Link>
      <div className="product-body">
        <div className="product-cat">{cat ? cat.name : product.category}</div>
        <h3>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="product-meta">
          <span>
            {t('moq')}: {product.moq}
          </span>
          <span>
            {t('lot')}: {product.lotSize}
          </span>
        </div>
        <div className="product-actions">
          <Link className="btn btn-outline" to={`/product/${product.id}`}>
            {t('btn.view')}
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => addToCart(product, product.moq)}
          >
            {t('btn.add')}
          </button>
        </div>
      </div>
    </article>
  );
}
