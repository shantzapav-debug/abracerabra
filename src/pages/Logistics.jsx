import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { submitLogistics, verifyLogisticsLink } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const TRANSPORT_MODES = [
  { value: 'Road', labelKey: 'logistics.mode.road' },
  { value: 'Rail', labelKey: 'logistics.mode.rail' },
  { value: 'Air', labelKey: 'logistics.mode.air' },
  { value: 'Sea', labelKey: 'logistics.mode.sea' },
  { value: 'Courier', labelKey: 'logistics.mode.courier' },
  { value: 'Customer pickup', labelKey: 'logistics.mode.pickup' },
];

const REQUIRED = ['address', 'country', 'mode_of_transport'];

const EMPTY = {
  address: '',
  landmark: '',
  location: '',
  country: '',
  mode_of_transport: '',
  preferred_delivery_date: '',
  contact_person: '',
  contact_phone: '',
  notes: '',
};

export default function Logistics() {
  const [params] = useSearchParams();
  const { leadId: pathLead } = useParams();
  const lead = params.get('lead') || pathLead || '';
  const token = params.get('t') || '';
  const { t } = useLanguage();
  const { toast } = useToast();
  const [phase, setPhase] = useState('checking');
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const requestKey = `${lead}\u0000${token}`;
  const [requestKeySeen, setRequestKeySeen] = useState(requestKey);

  if (requestKeySeen !== requestKey) {
    setRequestKeySeen(requestKey);
    setPhase('checking');
    setMeta(null);
    setDone(null);
  }

  useEffect(() => {
    let cancelled = false;
    verifyLogisticsLink(lead, token)
      .then((result) => {
        if (cancelled) return;
        if (result && result.valid) {
          setMeta(result);
          setPhase('form');
        } else {
          setMeta(null);
          setPhase('invalid');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setMeta(null);
        setPhase('unverified');
      });
    return () => {
      cancelled = true;
    };
  }, [lead, token]);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: false }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (phase !== 'form' || !meta?.valid) return;

    const nextErrors = {};
    let ok = true;
    REQUIRED.forEach((field) => {
      const valid = (form[field] || '').trim().length > 0;
      nextErrors[field] = !valid;
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
        lead_id: meta.lead_id,
        token,
        address: form.address.trim(),
        landmark: form.landmark.trim(),
        location: form.location.trim(),
        country: form.country.trim(),
        mode_of_transport: form.mode_of_transport.trim(),
        preferred_delivery_date: form.preferred_delivery_date,
        contact_person: form.contact_person.trim(),
        contact_phone: form.contact_phone.trim(),
        notes: form.notes.trim(),
      });
      setDone(result);
      setPhase('done');
      toast(t('logistics.toast.ok'), 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      toast(t('logistics.toast.fail'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const reference = meta?.ref || meta?.lead_id || '';

  return (
    <>
      <div className="page-head">
        <div className="container">
          <nav className="breadcrumb">
            <Link to="/">{t('nav.home')}</Link>
            <span className="sep">/</span>
            <span>{t('logistics.title')}</span>
          </nav>
          <h1>{t('logistics.title')}</h1>
          {phase === 'form' && (
            <p className="sub">
              {meta?.name
                ? t('logistics.greeting', { name: meta.name, ref: reference })
                : t('logistics.landing')}
            </p>
          )}
          {phase !== 'form' && <p className="sub">{t('logistics.sub')}</p>}
        </div>
      </div>

      <div className="container">
        {phase === 'checking' && (
          <div className="success-panel logistics-status" role="status">
            <h2>{t('logistics.checking')}</h2>
          </div>
        )}

        {phase === 'invalid' && (
          <div className="success-panel invalid-panel" role="alert">
            <div className="invalid-icon" aria-hidden="true">!</div>
            <h2>{t('logistics.invalid.title')}</h2>
            <p>{t('logistics.invalid.body')}</p>
            <Link to="/" className="btn btn-primary">
              {t('nav.home')}
            </Link>
          </div>
        )}

        {phase === 'unverified' && (
          <div className="success-panel invalid-panel" role="alert">
            <div className="invalid-icon" aria-hidden="true">!</div>
            <h2>{t('logistics.invalid.title')}</h2>
            <p>{t('logistics.unverified')}</p>
          </div>
        )}

        {phase === 'done' && done && (
          <div className="success-panel">
            <div className="success-icon">✓</div>
            <h2>{t('logistics.success.title')}</h2>
            <p>{t('logistics.success.body')}</p>
            {reference && (
              <div className="ref">
                {t('logistics.ref')}: {reference}
              </div>
            )}
            <Link to="/catalog" className="btn btn-primary">
              {t('success.back')}
            </Link>
          </div>
        )}

        {phase === 'form' && (
          <div className="card rfq-form-card logistics-card">
            <h3>{t('logistics.form.title')}</h3>
            <p className="form-lead">{t('logistics.form.lead')}</p>
            <div className="lead-chip">
              <span className="lead-chip-label">{t('logistics.ref')}</span>
              <code>{reference}</code>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <div className="form-group full">
                  <label htmlFor="logistics-address">
                    {t('logistics.address')} <span className="req">*</span>
                  </label>
                  <textarea
                    id="logistics-address"
                    name="address"
                    rows={3}
                    autoComplete="street-address"
                    value={form.address}
                    className={errors.address ? 'error' : ''}
                    onChange={(event) => setField('address', event.target.value)}
                    placeholder={t('logistics.address.ph')}
                  />
                  {errors.address && (
                    <span className="form-error show">{t('form.required')}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="logistics-landmark">{t('logistics.landmark')}</label>
                  <input
                    id="logistics-landmark"
                    type="text"
                    name="landmark"
                    value={form.landmark}
                    onChange={(event) => setField('landmark', event.target.value)}
                    placeholder={t('logistics.landmark.ph')}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="logistics-location">{t('logistics.location')}</label>
                  <input
                    id="logistics-location"
                    type="text"
                    name="location"
                    autoComplete="address-level2"
                    value={form.location}
                    onChange={(event) => setField('location', event.target.value)}
                    placeholder={t('logistics.location.ph')}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="logistics-country">
                    {t('logistics.country')} <span className="req">*</span>
                  </label>
                  <input
                    id="logistics-country"
                    type="text"
                    name="country"
                    autoComplete="country-name"
                    value={form.country}
                    className={errors.country ? 'error' : ''}
                    onChange={(event) => setField('country', event.target.value)}
                    placeholder={t('logistics.country.ph')}
                  />
                  {errors.country && (
                    <span className="form-error show">{t('form.required')}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="logistics-mode">
                    {t('logistics.mode')} <span className="req">*</span>
                  </label>
                  <select
                    id="logistics-mode"
                    name="mode_of_transport"
                    value={form.mode_of_transport}
                    className={errors.mode_of_transport ? 'error' : ''}
                    onChange={(event) => setField('mode_of_transport', event.target.value)}
                  >
                    <option value="">{t('logistics.mode.placeholder')}</option>
                    {TRANSPORT_MODES.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {t(mode.labelKey)}
                      </option>
                    ))}
                  </select>
                  {errors.mode_of_transport && (
                    <span className="form-error show">{t('form.required')}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="logistics-date">{t('logistics.date')}</label>
                  <input
                    id="logistics-date"
                    type="date"
                    name="preferred_delivery_date"
                    value={form.preferred_delivery_date}
                    onChange={(event) => setField('preferred_delivery_date', event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="logistics-contact">{t('logistics.contact')}</label>
                  <input
                    id="logistics-contact"
                    type="text"
                    name="contact_person"
                    autoComplete="name"
                    value={form.contact_person}
                    onChange={(event) => setField('contact_person', event.target.value)}
                    placeholder={t('logistics.contact.ph')}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="logistics-phone">{t('logistics.phone')}</label>
                  <input
                    id="logistics-phone"
                    type="tel"
                    name="contact_phone"
                    autoComplete="tel"
                    value={form.contact_phone}
                    onChange={(event) => setField('contact_phone', event.target.value)}
                    placeholder={t('logistics.phone.ph')}
                  />
                </div>
                <div className="form-group full">
                  <label htmlFor="logistics-notes">{t('logistics.notes')}</label>
                  <textarea
                    id="logistics-notes"
                    name="notes"
                    rows={3}
                    value={form.notes}
                    onChange={(event) => setField('notes', event.target.value)}
                    placeholder={t('logistics.notes.ph')}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
                style={{ marginTop: '1.25rem' }}
                disabled={submitting}
              >
                {submitting ? t('logistics.submitting') : t('logistics.submit')}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
