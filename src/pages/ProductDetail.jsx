import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils';
import ProductImage from '../components/ProductImage';
import QtyControl from '../components/QtyControl';

export default function ProductDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { productById, categoryById, loading } = useCatalog();
  const { getCartItem, addToCart } = useCart();

  const product = productById(id);
  const existing = product ? getCartItem(product.id) : null;
  const [qty, setQty] = useState(product?.moq || 1);

  useEffect(() => {
    if (product) {
      const ex = getCartItem(product.id);
      setQty(ex ? ex.qty : product.moq);
    }
  }, [product, getCartItem]);

  if (loading) return <div className="loading">{t('loading')}</div>;

  if (!product) {
    return (
      <div className="container page-head">
        <h1>{t('not.found.product')}</h1>
        <p className="sub">
          <Link to="/catalog">{t('nav.catalog')}</Link>
        </p>
      </div>
    );
  }

  const cat = categoryById(product.category);
  const belowMoq = qty < product.moq;

  return (
    <>
      <div className="container page-head">
        <nav className="breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <span className="sep">/</span>
          <Link to="/catalog">{t('nav.catalog')}</Link>
          <span className="sep">/</span>
          {cat && (
            <>
              <Link to={`/category/${cat.id}`}>{cat.name}</Link>
              <span className="sep">/</span>
            </>
          )}
          <span>{product.name}</span>
        </nav>
      </div>
      <div className="container">
        <div className="detail-grid">
          <div className="detail-img">
            <ProductImage src={product.image} alt={product.name} />
          </div>
          <div className="detail-info">
            {cat && <div className="product-cat">{cat.name}</div>}
            <h1>{product.name}</h1>
            <div className="indicative-price">
              <span className="amount">
                {formatPrice(product.indicativePrice, product.currency)}
              </span>
              <span className="unit">/ {product.unit}</span>
              <span className="indicative-label">
                {t('price.indicative')} · {t('price.nonbinding')}
              </span>
            </div>
            <table className="spec-table">
              <tbody>
                <tr>
                  <th>{t('moq')}</th>
                  <td>
                    {product.moq} {product.unit}s
                  </td>
                </tr>
                <tr>
                  <th>{t('lot')}</th>
                  <td>{product.lotSize}</td>
                </tr>
                <tr>
                  <th>{t('unit')}</th>
                  <td>{product.unit}</td>
                </tr>
                <tr>
                  <th>{t('category')}</th>
                  <td>{cat ? cat.name : product.category}</td>
                </tr>
                <tr>
                  <th>{t('specs')}</th>
                  <td>{product.specs}</td>
                </tr>
              </tbody>
            </table>
            <div className="qty-row">
              <div className="qty-field">
                <label htmlFor="qty-input">{t('qty')}</label>
                <QtyControl
                  value={qty}
                  min={product.moq}
                  step={product.lotSize}
                  onChange={setQty}
                />
              </div>
            </div>
            <p className={`moq-hint${belowMoq ? ' error' : ' ok'}`}>
              {belowMoq
                ? `${t('toast.moq')}: ${product.moq} ${product.unit}s ${t('qty.required', { qty })}`
                : `${t('moq')}: ${product.moq} · ${t('lot')}: ${product.lotSize} · ${t('qty.ok')}`}
            </p>
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              disabled={belowMoq}
              onClick={() => addToCart(product, qty)}
            >
              {t('btn.add')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
