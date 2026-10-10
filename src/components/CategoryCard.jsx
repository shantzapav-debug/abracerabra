import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function CategoryCard({ category, count, image }) {
  const { t } = useLanguage();
  return (
    <Link to={`/category/${category.id}`} className="cat-card">
      <div className="cat-card-media">
        {image ? <img src={image} alt="" /> : <span className="cat-icon">{(category.name || '?').charAt(0)}</span>}
      </div>
      <div className="cat-card-body">
        <h3>{category.name}</h3>
        <span>
          {count} {t('products')}
        </span>
      </div>
    </Link>
  );
}
