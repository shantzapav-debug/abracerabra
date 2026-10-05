import { Link } from 'react-router-dom';
import { catInitial } from '../utils';
import { useLanguage } from '../context/LanguageContext';

export default function CategoryCard({ category, count }) {
  const { t } = useLanguage();
  return (
    <Link to={`/category/${category.id}`} className="cat-card">
      <div className="cat-icon">{catInitial(category.name)}</div>
      <h3>{category.name}</h3>
      <span>
        {count} {t('products')}
      </span>
    </Link>
  );
}
