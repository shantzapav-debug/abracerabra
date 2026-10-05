import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

const LANGS = [
  { code: 'en', title: 'English' },
  { code: 'ja', title: '日本語' },
  { code: 'fr', title: 'Français' },
  { code: 'ar', title: 'العربية' },
];

export default function Header() {
  const { t, lang, setLang } = useLanguage();
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo" aria-label="Abracerabra Home" onClick={closeMenu}>
          <span className="logo-mark">A</span>
          <span className="logo-text">
            <strong>Abracerabra</strong>
            <small>Global B2B RFQ</small>
          </span>
        </Link>

        <nav
          className={`main-nav${menuOpen ? ' open' : ''}`}
          id="main-nav"
          aria-label="Primary"
        >
          <NavLink to="/" end data-nav="home" onClick={closeMenu}>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/catalog" data-nav="catalog" onClick={closeMenu}>
            {t('nav.catalog')}
          </NavLink>
          <NavLink to="/rfq-cart" data-nav="rfq" className="nav-rfq" onClick={closeMenu}>
            {t('nav.rfq')}
          </NavLink>
        </nav>

        <div className="header-actions">
          <div className="lang-toggle" role="group" aria-label="Language">
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                className={`lang-btn${lang === l.code ? ' active' : ''}`}
                title={l.title}
                onClick={() => setLang(l.code)}
              >
                {l.code.toUpperCase()}
              </button>
            ))}
          </div>
          <Link to="/rfq-cart" className="cart-btn" aria-label="RFQ Quote Cart" onClick={closeMenu}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm7 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM3 3h2l2.4 12.3a2 2 0 0 0 2 1.7h7.6a2 2 0 0 0 2-1.6L21 8H7" />
            </svg>
            <span className="cart-label">{t('nav.quote')}</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
