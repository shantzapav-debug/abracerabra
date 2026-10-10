import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { submitQuote } from '../api';
import { formatPrice } from '../utils';
import ProductImage from '../components/ProductImage';
import QtyControl from '../components/QtyControl';

const FIELDS = ['name', 'country', 'state', 'city', 'email', 'mobile'];

export default function RfqCart() {
  const { t } = useLanguage();
  const {
    cart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartTotals,
    validateCartMoq,
  } = useCart();
  const { toast } = useToast();
  const [submitResult, setSubmitResult] = useState(null);
  const [form, setForm] = useState({
    name: '',
    country: '',
    state: '',
    city: '',
    email: '',
    mobile: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const totals = cartTotals();
  const moqOk = validateCartMoq();

  if (submitResult) {
    const { ref, lead_id: leadId } = submitResult;
    return (
      <>
        <div className="page-head">
          <div className="container">
            <nav className="breadcrumb">
              <Link to="/">{t('nav.home')}</Link>
              <span className="sep">/</span>
              <span>{t('cart.title')}</span>
            </nav>
          </div>
        </div>
        <div className="container">
          <div className="success-panel">
            <div className="success-icon">✓</div>
            <h2>{t('success.title')}</h2>
            <p>{t('success.body')}</p>
            <div className="ref-stack">
              {ref && <div className="ref">Ref: {ref}</div>}
              {leadId && <div className="ref">Lead ID: {leadId}</div>}
            </div>
            <p className="success-note">{t('success.step2.note')}</p>
            {leadId && (
              <p className="success-demo">
                {t('success.step2.demo')}{' '}
                <Link to={`/logistics/${leadId}`} className="demo-link">
                  {t('success.step2.link')}
                </Link>
              </p>
            )}
            <div className="success-actions">
              {leadId && (
                <Link to={`/logistics/${leadId}`} className="btn btn-primary">
                  {t('success.step2.cta')}
                </Link>
              )}
              <Link to="/catalog" className="btn btn-ghost">
                {t('success.back')}
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart.length) {
      toast('Cart is empty', 'error');
      return;
    }
    if (!moqOk) {
      toast(t('toast.moq'), 'error');
      return;
    }

    const nextErrors = {};
    let ok = true;
    FIELDS.forEach((f) => {
      const val = (form[f] || '').trim();
      let valid = val.length > 0;
      if (f === 'email' && valid) valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      nextErrors[f] = !valid;
      if (!valid) ok = false;
    });
    setErrors(nextErrors);
    if (!ok) {
      toast('Please fill all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const contact = Object.fromEntries(
        FIELDS.map((f) => [f, form[f].trim()]),
      );
      const result = await submitQuote({
        contact,
        items: cart.map((i) => ({ ...i })),
        totals,
      });
      clearCart();
      setSubmitResult({ ref: result.ref, lead_id: result.lead_id });
      toast('RFQ submitted', 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      toast('Submit failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div className="container">
          <nav className="breadcrumb">
            <Link to="/">{t('nav.home')}</Link>
            <span className="sep">/</span>
            <span>{t('cart.title')}</span>
          </nav>
          <h1>{t('cart.title')}</h1>
          <p className="sub">
            {totals.items} line item(s) · {totals.units} units
          </p>
        </div>
      </div>
      <div className="container">
        <div className="cart-layout">
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <h3>{t('cart.empty')}</h3>
                <p>{t('cart.empty.sub')}</p>
                <Link to="/catalog" className="btn btn-primary">
                  {t('cart.browse')}
                </Link>
              </div>
            ) : (
              cart.map((item) => {
                const below = item.qty < item.moq;
                return (
                  <div className="cart-item" key={item.productId}>
                    <div className="cart-item-img">
                      <ProductImage src={item.image} alt={item.name} />
                    </div>
                    <div>
                      <h3>
                        <Link to={`/product/${item.productId}`}>{item.name}</Link>
                      </h3>
                      <div className="meta">
                        {formatPrice(item.indicativePrice, item.currency)} /{' '}
                        {item.unit} · {t('moq')} {item.moq}
                        {below && (
                          <span style={{ color: 'var(--danger)' }}>
                            {' '}
                            {t('below.moq')}
                          </span>
                        )}
                      </div>
                      <div className="cart-item-actions">
                        <QtyControl
                          value={item.qty}
                          min={item.moq}
                          step={item.lotSize}
                          size="sm"
                          onChange={(q) => {
                            if (q < item.moq) {
                              toast(`${t('toast.moq')} (${item.moq})`, 'error');
                              return;
                            }
                            updateCartQty(item.productId, q);
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          {t('remove')}
                        </button>
                      </div>
                    </div>
                    <div className="line-price">
                      {formatPrice(
                        item.qty * item.indicativePrice,
                        item.currency,
                      )}
                      <small>{t('price.indicative')}</small>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="card rfq-form-card">
            <h3>{t('form.title')}</h3>
            <p className="form-lead">{t('form.lead')}</p>
            {cart.length === 0 ? (
              <p className="form-lead">{t('add.products.form')}</p>
            ) : (
              <>
                <div className="cart-summary">
                  <div className="row">
                    <span>{t('summary.items')}</span>
                    <strong>{totals.items}</strong>
                  </div>
                  <div className="row">
                    <span>{t('summary.units')}</span>
                    <strong>{totals.units}</strong>
                  </div>
                  <div className="row total">
                    <span>{t('summary.est')}</span>
                    <strong>{formatPrice(totals.est, totals.currency || 'INR')}</strong>
                  </div>
                  <p className="note">{t('summary.note')}</p>
                </div>
                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-grid">
                    <div className="form-group full">
                      <label>
                        {t('form.name')} <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        value={form.name}
                        className={errors.name ? 'error' : ''}
                        onChange={(e) => setField('name', e.target.value)}
                      />
                      {errors.name && (
                        <span className="form-error show">{t('form.required')}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>
                        {t('form.country')} <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="country"
                        autoComplete="country-name"
                        placeholder="e.g. Japan"
                        value={form.country}
                        className={errors.country ? 'error' : ''}
                        onChange={(e) => setField('country', e.target.value)}
                      />
                      {errors.country && (
                        <span className="form-error show">{t('form.required')}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>
                        {t('form.state')} <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="state"
                        autoComplete="address-level1"
                        value={form.state}
                        className={errors.state ? 'error' : ''}
                        onChange={(e) => setField('state', e.target.value)}
                      />
                      {errors.state && (
                        <span className="form-error show">{t('form.required')}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>
                        {t('form.city')} <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        autoComplete="address-level2"
                        value={form.city}
                        className={errors.city ? 'error' : ''}
                        onChange={(e) => setField('city', e.target.value)}
                      />
                      {errors.city && (
                        <span className="form-error show">{t('form.required')}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>
                        {t('form.email')} <span className="req">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={form.email}
                        className={errors.email ? 'error' : ''}
                        onChange={(e) => setField('email', e.target.value)}
                      />
                      {errors.email && (
                        <span className="form-error show">{t('form.required')}</span>
                      )}
                    </div>
                    <div className="form-group full">
                      <label>
                        {t('form.mobile')} <span className="req">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        autoComplete="tel"
                        placeholder="+81 …"
                        value={form.mobile}
                        className={errors.mobile ? 'error' : ''}
                        onChange={(e) => setField('mobile', e.target.value)}
                      />
                      {errors.mobile && (
                        <span className="form-error show">{t('form.required')}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg btn-block"
                    style={{ marginTop: '1.25rem' }}
                    disabled={!moqOk || submitting}
                  >
                    {t('form.submit')}
                  </button>
                  {!moqOk && (
                    <p className="moq-hint error" style={{ marginTop: '0.75rem' }}>
                      {t('fix.moq')}
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
