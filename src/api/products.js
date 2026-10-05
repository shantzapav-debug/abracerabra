/**
 * Products API — try FastAPI GET /api/products, fall back to local JSON.
 */
import catalog from '../data/products.json';
import { apiFetch } from './client';

const localCatalog = () => ({
  company: catalog.company,
  categories: catalog.categories,
  products: catalog.products,
});

export async function getCatalog() {
  try {
    const data = await apiFetch('/api/products');
    if (data && Array.isArray(data.products)) return data;
  } catch (err) {
    console.warn('[Abracerabra] products API unreachable, using local mock', err);
  }
  return localCatalog();
}

export async function getProducts() {
  const data = await getCatalog();
  return data.products;
}

export async function getProduct(id) {
  const products = await getProducts();
  return products.find((p) => p.id === id) || null;
}

export async function getProductsByCategory(categoryId) {
  const products = await getProducts();
  return products.filter((p) => p.category === categoryId);
}

export async function getCategories() {
  const data = await getCatalog();
  return data.categories;
}

export async function getCategory(id) {
  const categories = await getCategories();
  return categories.find((c) => c.id === id) || null;
}

export async function getCompany() {
  const data = await getCatalog();
  return data.company;
}
