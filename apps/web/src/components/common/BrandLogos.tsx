import React, { useState } from 'react';

interface BrandLogosProps {
  // Prefixo das classes das imagens: `${classPrefix}logo-image ${classPrefix}logo-primary`
  classPrefix?: string;
  // Classe do texto exibido quando a logo primária não carrega
  fallbackClassName: string;
}

// Logos primária e secundária da marca, com fallback em texto
const BrandLogos: React.FC<BrandLogosProps> = ({ classPrefix = '', fallbackClassName }) => {
  const [primaryError, setPrimaryError] = useState(false);
  const [secondaryError, setSecondaryError] = useState(false);

  if (primaryError) {
    return (
      <div className={fallbackClassName}>
        <span className="logo-main">MINGO</span>
        <span className="logo-sub">COGUS</span>
      </div>
    );
  }

  return (
    <>
      <img
        src="/logo.png"
        alt="Mingo Cogus - Logo Primária"
        className={`${classPrefix}logo-image ${classPrefix}logo-primary`}
        onError={() => setPrimaryError(true)}
      />
      {!secondaryError && (
        <img
          src="/logo-secundaria.png"
          alt="Mingo Cogus - Logo Secundária"
          className={`${classPrefix}logo-image ${classPrefix}logo-secondary`}
          onError={() => setSecondaryError(true)}
        />
      )}
    </>
  );
};

export default BrandLogos;
