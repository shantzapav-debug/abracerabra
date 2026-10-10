import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { submitLogistics } from '../api';

const TRANSPORT_MODES = [
  { value: 'Sea Freight', labelKey: 'logistics.mode.sea' },
  { value: 'Air Freight', labelKey: 'logistics.mode.air' },
  { value: 'Road / Truck', labelKey: 'logistics.mode.road' },
  { value: 'Rail', labelKey: 'logistics.mode.rail' },
  { value: 'Multimodal', labelKey: 'logistics.mode.multi' },
];

const REQUIRED = ['address', 'mode_of_transport'];

export default function Logistics() {
  const { leadId } = useParams();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = useState({
    address: '',
    landmark: '',
    location: '',
    mode_of_transport: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!leadId) {
      toast(t('logistics.missing'), 'error');
      return;
    }

    const nextErrors = {};
    let ok = true;
    REQUIRED.forEach((f) => {
      const valid = (form[f] || '').trim().length > 0;
      nextErrors[f] = !valid;
      if (!valid) ok = false;
    });
    setErrors(nextErrors);
    if (!ok) {
      toast(t('logistics.fill'), 'error');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitLogistics({
        lead_id: leadId,
        address: form.address.trim(),
        landmark: form.landmark.trim(),
        location: form.location.trim(),
        mode_of_transport: form.mode_of_transport.trim(),
      });
      setDone(result);
      toast(t('logistics.toast.ok'), 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      toast(t('logistics.toast.fail'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <>
        <div className="page-head">
          <div className="container">
            <nav className="breadcrumb">
              <Link to="/">{t('nav.home')}</Link>
              <span className="sep">/</span>
              <span>{t('logistics.title')}</span>
            </nav>
          </div>
        </div>
        <div className="container">
          <div className="success-panel">
            <div className="success-icon">✓</div>
            <h2>{t('logistics.success.title')}</h2>
            <p>{t('logistics.success.body')}</p>
            <div className="ref">Lead ID: {done.lead_id || leadId}</div>
            {done.offline && (
              <p className="success-note">{t('logistics.offline')}</p>
            )}
            <Link to="/catalog" className="btn btn-primary">
              {t('success.back')}
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <nav className="breadcrumb">
            <Link to="/">{t('nav.home')}</Link>
            <span className="sep">/</span>
            <Link to="/rfq-cart">{t('cart.title')}</Link>
            <span className="sep">/</span>
            <span>{t('logistics.title')}</span>
          </nav>
          <h1>{t('logistics.title')}</h1>
          <p className="sub">{t('logistics.sub')}</p>
        </div>
      </div>
      <div className="container">
        <div className="card rfq-form-card logistics-card">
          <h3>{t('logistics.form.title')}</h3>
          <p className="form-lead">{t('logistics.form.lead')}</p>
          <div className="lead-chip">
            <span className="lead-chip-label">Lead ID</span>
            <code>{leadId || '—'}</code>
          </div>
          {!leadId && (
            <p className="moq-hint error" style={{ marginBottom: '1rem' }}>
              {t('logistics.missing')}
            </p>
          )}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-group full">
                <label>
                  {t('logistics.address')} <span className="req">*</span>
                </label>
                <textarea
                  name="address"
                  rows={3}
                  autoComplete="street-address"
                  value={form.address}
                  className={errors.address ? 'error' : ''}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder={t('logistics.address.ph')}
                />
                {errors.address && (
                  <span className="form-error show">{t('form.required')}</span>
                )}
              </div>
              <div className="form-group">
                <label>{t('logistics.landmark')}</label>
                <input
                  type="text"
                  name="landmark"
                  value={form.landmark}
                  onChange={(e) => setField('landmark', e.target.value)}
                  placeholder={t('logistics.landmark.ph')}
                />
              </div>
              <div className="form-group">
                <label>{t('logistics.location')}</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  placeholder={t('logistics.location.ph')}
                />
              </div>
              <div className="form-group full">
                <label>
                  {t('logistics.mode')} <span className="req">*</span>
                </label>
                <select
                  name="mode_of_transport"
                  value={form.mode_of_transport}
                  className={errors.mode_of_transport ? 'error' : ''}
                  onChange={(e) => setField('mode_of_transport', e.target.value)}
                >
                  <option value="">{t('logistics.mode.placeholder')}</option>
                  {TRANSPORT_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {t(m.labelKey)}
                    </option>
                  ))}
                </select>
                {errors.mode_of_transport && (
                  <span className="form-error show">{t('form.required')}</span>
                )}
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              style={{ marginTop: '1.25rem' }}
              disabled={submitting || !leadId}
            >
              {submitting ? t('logistics.submitting') : t('logistics.submit')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
