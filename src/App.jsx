import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { CatalogProvider } from './context/CatalogContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';
import RfqCart from './pages/RfqCart';
import Logistics from './pages/Logistics';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <CartProvider>
          <CatalogProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="catalog" element={<Catalog />} />
                  <Route path="category/:id" element={<Category />} />
                  <Route path="product/:id" element={<ProductDetail />} />
                  <Route path="rfq-cart" element={<RfqCart />} />
                  <Route path="logistics/:leadId" element={<Logistics />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CatalogProvider>
        </CartProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
