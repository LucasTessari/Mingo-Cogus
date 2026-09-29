import React, { useMemo, useState } from 'react';

interface CustomIconProps {
  src?: string; // URL ou caminho da imagem
  alt?: string;
  className?: string;
  size?: number;
  fallback?: React.ReactNode; // Ícone SVG de fallback
}

// Ícones personalizados empacotados em src/assets/icons (nome do arquivo -> URL final)
const BUNDLED_ICONS = import.meta.glob<string>('../../assets/icons/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

// URLs externas e caminhos absolutos são usados como estão; nomes de arquivo são
// procurados em assets/icons e, se não existirem lá, usados como caminho direto
const resolveIconSrc = (src: string): string => {
  const isExternal =
    src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//');
  if (isExternal || src.startsWith('/')) {
    return src;
  }
  return BUNDLED_ICONS[`../../assets/icons/${src}`] ?? src;
};

/**
 * Componente para renderizar ícones personalizados
 * Suporta: imagens (SVG, PNG, JPG), URLs, ou componentes React
 */
const CustomIcon: React.FC<CustomIconProps> = ({
  src,
  alt = 'Icon',
  className = '',
  size = 56,
  fallback,
}) => {
  const [imageError, setImageError] = useState(false);
  const imageSrc = useMemo(() => (src ? resolveIconSrc(src) : null), [src]);

  // Sem imagem ou com erro ao carregá-la, mostra o fallback
  if (imageError || !imageSrc) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
      onError={() => setImageError(true)}
    />
  );
};

export default CustomIcon;
