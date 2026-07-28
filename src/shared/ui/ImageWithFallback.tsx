import { ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
}

export function ImageWithFallback({ src, alt, className }: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className={['image-fallback', className].filter(Boolean).join(' ')} role="img" aria-label={alt || 'Изображение готовится'}>
        <ImageIcon size={24} aria-hidden="true" />
      </span>
    );
  }

  return <img className={className} src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
