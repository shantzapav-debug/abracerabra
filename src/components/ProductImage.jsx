import { useState } from 'react';

export default function ProductImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return <div className={`placeholder ${className}`.trim()}>No image</div>;
  }

  return (
    <>
      <img
        src={src}
        alt={alt || 'Product'}
        className={className}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </>
  );
}
