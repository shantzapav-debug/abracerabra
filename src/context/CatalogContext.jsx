import { createContext, useContext, useState, useEffect } from 'react';
import { getCatalog } from '../api';

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCatalog()
      .then((catalog) => {
        if (!cancelled) {
          setData(catalog);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryById = (id) => data?.categories.find((c) => c.id === id);
  const productById = (id) => data?.products.find((p) => p.id === id);
  const productsByCategory = (catId) =>
    data?.products.filter((p) => p.category === catId) || [];
  const categoryCount = (catId) => productsByCategory(catId).length;

  return (
    <CatalogContext.Provider
      value={{
        data,
        loading,
        error,
        company: data?.company,
        categories: data?.categories || [],
        products: data?.products || [],
        categoryById,
        productById,
        productsByCategory,
        categoryCount,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
