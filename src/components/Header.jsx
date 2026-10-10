import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';

const MOBILE_NAV_QUERY = '(max-width: 760px)';
const HOVER_QUERY = '(hover: hover) and (pointer: fine)';
const DROPDOWN_CLOSE_DELAY = 280;

function prefersTapNav() {
  const mobileLayout = window.matchMedia(MOBILE_NAV_QUERY).matches;
  const canHover = window.matchMedia(HOVER_QUERY).matches;
  return mobileLayout || !canHover;
}

export default function Header() {
  const { t } = useLanguage();
  const { cartCount } = useCart();
  const { categories } = useCatalog();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [tapNav, setTapNav] = useState(false);
  const closeTimer = useRef(null);

  const productsActive = /^\/(catalog|category|product)(\/|$)/.test(pathname);

  useEffect(() => {
    const mobileLayout = window.matchMedia(MOBILE_NAV_QUERY);
    const canHover = window.matchMedia(HOVER_QUERY);
    const onChange = () => {
      setTapNav(prefersTapNav());
      setProductsOpen(false);
    };
    onChange();
    mobileLayout.addEventListener('change', onChange);
    canHover.addEventListener('change', onChange);
    return () => {
      mobileLayout.removeEventListener('change', onChange);
      canHover.removeEventListener('change', onChange);
    };
  }, []);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openProducts = () => {
    clearCloseTimer();
    setProductsOpen(true);
  };

  const closeProductsSoon = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setProductsOpen(false), DROPDOWN_CLOSE_DELAY);
  };

  const closeMenu = () => {
    clearCloseTimer();
    setMenuOpen(false);
    setProductsOpen(false);
  };

  const onProductsClick = () => {
    if (!tapNav) return;
    setProductsOpen((open) => !open);
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo" aria-label="Abracerabra Home" onClick={closeMenu}>
          <span className="logo-mark" aria-hidden="true">A</span>
          <span className="logo-text">
            <strong>Abracerabra</strong>
            <small>{t('brand.descriptor')}</small>
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
          <div
            className={`nav-item${productsOpen ? ' open' : ''}${productsActive ? ' active' : ''}`}
            onMouseEnter={() => { if (!tapNav) openProducts(); }}
            onMouseLeave={() => { if (!tapNav) closeProductsSoon(); }}
            onFocus={() => { if (!tapNav) openProducts(); }}
            onBlur={(event) => {
              if (tapNav || event.currentTarget.contains(event.relatedTarget)) return;
              closeProductsSoon();
            }}
          >
            <button
              type="button"
              className="nav-parent"
              aria-expanded={productsOpen}
              aria-haspopup="true"
              onClick={onProductsClick}
            >
              {t('nav.products')}
              <span className="nav-caret" aria-hidden="true" />
            </button>
            <div className="nav-dropdown">
              {categories.map((category) => (
                <NavLink
                  key={category.id}
                  to={`/category/${category.id}`}
                  onClick={closeMenu}
                >
                  {category.name}
                </NavLink>
              ))}
              <NavLink to="/catalog" className="nav-dropdown-all" onClick={closeMenu}>
                {t('cat.view')}
              </NavLink>
            </div>
          </div>
          <NavLink to="/rfq-cart" data-nav="rfq" className="nav-rfq" onClick={closeMenu}>
            {t('nav.rfq')}
          </NavLink>
        </nav>

        <div className="header-actions">
          <Link
            to="/rfq-cart"
            className="btn btn-primary nav-quote"
            aria-label={t('nav.request')}
            onClick={closeMenu}
          >
            <svg className="quote-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M8 6h8M8 10h8M8 14h5" />
              <rect x="5" y="3" width="14" height="18" rx="1.5" />
            </svg>
            <span className="quote-text" aria-hidden="true">{t('nav.request')}</span>
            <span className="quote-short" aria-hidden="true">{t('nav.quote')}</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
