import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import { useToast } from './ToastContext';

const CART_KEY = 'abracerabra_rfq_cart';

const CartContext = createContext(null);

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const getCartItem = useCallback(
    (productId) => cart.find((i) => i.productId === productId),
    [cart],
  );

  const addToCart = useCallback(
    (product, qty) => {
      if (qty < product.moq) {
        toast(`${t('toast.moq')} (${product.moq})`, 'error');
        return false;
      }
      const existing = cart.find((i) => i.productId === product.id);
      if (existing) {
        setCart((prev) =>
          prev.map((i) => (i.productId === product.id ? { ...i, qty } : i)),
        );
        toast(t('toast.updated'), 'success');
      } else {
        setCart((prev) => [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            image: product.image,
            moq: product.moq,
            lotSize: product.lotSize,
            indicativePrice: product.indicativePrice,
            currency: product.currency,
            unit: product.unit,
            qty,
          },
        ]);
        toast(t('toast.added'), 'success');
      }
      return true;
    },
    [cart, t, toast],
  );

  const updateCartQty = useCallback(
    (productId, qty) => {
      const item = cart.find((i) => i.productId === productId);
      if (!item) return;
      if (qty < item.moq) {
        toast(`${t('toast.moq')} (${item.moq})`, 'error');
        return;
      }
      setCart((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, qty } : i)),
      );
    },
    [cart, t, toast],
  );

  const removeFromCart = useCallback(
    (productId) => {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      toast(t('toast.removed'), 'success');
    },
    [t, toast],
  );

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotals = useCallback(() => {
    const items = cart.length;
    const units = cart.reduce((s, i) => s + i.qty, 0);
    const est = cart.reduce((s, i) => s + i.qty * i.indicativePrice, 0);
    const currency = cart[0]?.currency || 'INR';
    return { items, units, est, currency };
  }, [cart]);

  const validateCartMoq = useCallback(
    () => cart.every((i) => i.qty >= i.moq),
    [cart],
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        getCartItem,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartTotals,
        validateCartMoq,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
