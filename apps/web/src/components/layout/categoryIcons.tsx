import type { ReactElement } from 'react';

// Ícones SVG melhorados para diferentes tipos de produtos de cogumelos
export const CATEGORY_ICONS: Record<string, ReactElement> = {
  esporos: (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="syringeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8bc34a" />
          <stop offset="100%" stopColor="#7cb342" />
        </linearGradient>
      </defs>
      {/* Seringa com detalhes */}
      <rect
        x="5"
        y="2"
        width="14"
        height="19"
        rx="2.5"
        fill="url(#syringeGrad)"
        stroke="#50624A"
        strokeWidth="1.5"
      />
      <rect x="7" y="1" width="10" height="2" rx="1" fill="#50624A" />
      <rect x="7" y="19" width="10" height="3" rx="1" fill="#50624A" />
      {/* Partículas de esporos */}
      <circle cx="12" cy="8" r="2" fill="#ffffff" opacity="0.9" />
      <circle cx="9" cy="11" r="1.5" fill="#ffffff" opacity="0.8" />
      <circle cx="15" cy="11" r="1.5" fill="#ffffff" opacity="0.8" />
      <circle cx="10.5" cy="14" r="1" fill="#ffffff" opacity="0.7" />
      <circle cx="13.5" cy="14" r="1" fill="#ffffff" opacity="0.7" />
      <circle cx="12" cy="16" r="1.2" fill="#ffffff" opacity="0.6" />
    </svg>
  ),
  'kits-cultivo': (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="kitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A88D4A" />
          <stop offset="100%" stopColor="#8B6F4A" />
        </linearGradient>
      </defs>
      {/* Caixa/Kit com perspectiva */}
      <rect
        x="3"
        y="7"
        width="18"
        height="14"
        rx="2"
        fill="url(#kitGrad)"
        stroke="#50624A"
        strokeWidth="1.5"
      />
      <path d="M7 7V4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V7" fill="#50624A" />
      <rect x="5" y="9" width="14" height="10" rx="1" fill="#ECE8E1" opacity="0.3" />
      {/* Cogumelos crescendo */}
      <g transform="translate(12, 12)">
        <path
          d="M-2 -2C-3 -2 -3.5 -1 -3.5 0C-3.5 1 -3 2 -2 2C-1 2 -0.5 1 -0.5 0C-0.5 -1 -1 -2 -2 -2Z"
          fill="#8bc34a"
          stroke="#50624A"
          strokeWidth="0.5"
        />
        <path d="M-2 2V4" stroke="#8B6F4A" strokeWidth="1" strokeLinecap="round" />
        <path d="M-3 4H-1" stroke="#8B6F4A" strokeWidth="1" strokeLinecap="round" />
        <circle cx="-2" cy="0" r="0.5" fill="#ffffff" opacity="0.8" />
      </g>
      <g transform="translate(8, 14)">
        <path
          d="M-1.5 -1.5C-2.2 -1.5 -2.5 -0.8 -2.5 0C-2.5 0.8 -2.2 1.5 -1.5 1.5C-0.8 1.5 -0.5 0.8 -0.5 0C-0.5 -0.8 -0.8 -1.5 -1.5 -1.5Z"
          fill="#7cb342"
          stroke="#50624A"
          strokeWidth="0.5"
        />
        <path d="M-1.5 1.5V3" stroke="#8B6F4A" strokeWidth="0.8" strokeLinecap="round" />
        <circle cx="-1.5" cy="0" r="0.4" fill="#ffffff" opacity="0.7" />
      </g>
      <g transform="translate(16, 14)">
        <path
          d="M-1.5 -1.5C-2.2 -1.5 -2.5 -0.8 -2.5 0C-2.5 0.8 -2.2 1.5 -1.5 1.5C-0.8 1.5 -0.5 0.8 -0.5 0C-0.5 -0.8 -0.8 -1.5 -1.5 -1.5Z"
          fill="#7cb342"
          stroke="#50624A"
          strokeWidth="0.5"
        />
        <path d="M-1.5 1.5V3" stroke="#8B6F4A" strokeWidth="0.8" strokeLinecap="round" />
        <circle cx="-1.5" cy="0" r="0.4" fill="#ffffff" opacity="0.7" />
      </g>
    </svg>
  ),
  'cogumelos-desidratados': (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="driedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B6F4A" />
          <stop offset="100%" stopColor="#6B5538" />
        </linearGradient>
      </defs>
      {/* Cogumelo desidratado */}
      <path
        d="M12 3.5C8.5 3.5 6.5 5.5 6.5 8.5C6.5 11.5 8.5 13.5 12 13.5C15.5 13.5 17.5 11.5 17.5 8.5C17.5 5.5 15.5 3.5 12 3.5Z"
        fill="url(#driedGrad)"
        stroke="#50624A"
        strokeWidth="1.5"
      />
      <path
        d="M10 8.5C10 8.5 10.3 10 11.5 10C12.7 10 13 8.5 13 8.5"
        stroke="#ECE8E1"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path d="M12 13.5V18.5" stroke="#8B6F4A" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 18.5H15" stroke="#8B6F4A" strokeWidth="2" strokeLinecap="round" />
      {/* Textura de desidratação */}
      <path d="M8 6L16 16" stroke="#6B5538" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M16 6L8 16" stroke="#6B5538" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <circle cx="10" cy="7" r="0.5" fill="#6B5538" opacity="0.5" />
      <circle cx="14" cy="10" r="0.5" fill="#6B5538" opacity="0.5" />
    </svg>
  ),
  'culturas-liquidas': (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8bc34a" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#7cb342" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {/* Frasco com detalhes */}
      <rect
        x="5.5"
        y="6"
        width="13"
        height="15"
        rx="2.5"
        fill="#ECE8E1"
        stroke="#50624A"
        strokeWidth="1.5"
      />
      <path d="M7.5 2V6" stroke="#50624A" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.5 2V6" stroke="#50624A" strokeWidth="2" strokeLinecap="round" />
      <rect x="7.5" y="1" width="9" height="1.5" rx="0.5" fill="#50624A" />
      {/* Líquido com micélio */}
      <rect x="7.5" y="12" width="9" height="7" rx="1.5" fill="url(#liquidGrad)" />
      <path d="M9 14H15" stroke="#50624A" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Partículas de micélio flutuando */}
      <circle cx="10" cy="15" r="1" fill="#ffffff" opacity="0.9" />
      <circle cx="12" cy="16.5" r="1.2" fill="#ffffff" opacity="0.8" />
      <circle cx="14" cy="15.5" r="0.8" fill="#ffffff" opacity="0.9" />
      <circle cx="11" cy="17.5" r="0.6" fill="#ffffff" opacity="0.7" />
      <circle cx="13.5" cy="18" r="0.7" fill="#ffffff" opacity="0.8" />
      {/* Bolhas */}
      <circle cx="9.5" cy="13.5" r="0.3" fill="#ffffff" opacity="0.6" />
      <circle cx="14.5" cy="13.8" r="0.4" fill="#ffffff" opacity="0.6" />
    </svg>
  ),
  promocoes: (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="promoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A88D4A" />
          <stop offset="100%" stopColor="#C4A868" />
        </linearGradient>
      </defs>
      {/* Estrela brilhante */}
      <path
        d="M12 1.5L15 8L22 9L16.5 14L18 21L12 17.5L6 21L7.5 14L2 9L9 8L12 1.5Z"
        fill="url(#promoGrad)"
        stroke="#8B6F3A"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 1.5L15 8L22 9L16.5 14L18 21L12 17.5L6 21L7.5 14L2 9L9 8L12 1.5Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.5"
        opacity="0.3"
      />
      {/* Tag de desconto */}
      <path d="M7.5 7.5L16.5 16.5" stroke="#8B6F3A" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="7.5" cy="7.5" r="2" fill="#ffffff" stroke="#8B6F3A" strokeWidth="1" />
      <circle cx="16.5" cy="16.5" r="2" fill="#ffffff" stroke="#8B6F3A" strokeWidth="1" />
      <text x="7.5" y="8.5" fontSize="2.5" fill="#8B6F3A" textAnchor="middle" fontWeight="bold">
        %
      </text>
    </svg>
  ),
  acessorios: (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="toolsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B8881" />
          <stop offset="100%" stopColor="#505254" />
        </linearGradient>
      </defs>
      {/* Caixa de ferramentas */}
      <rect
        x="2.5"
        y="8"
        width="19"
        height="13"
        rx="2.5"
        fill="url(#toolsGrad)"
        stroke="#50624A"
        strokeWidth="1.5"
      />
      <path
        d="M7.5 8V5.5C7.5 4.39543 8.39543 3.5 9.5 3.5H14.5C15.6046 3.5 16.5 4.39543 16.5 5.5V8"
        fill="#50624A"
      />
      <rect x="4" y="10" width="16" height="9" rx="1" fill="#ECE8E1" opacity="0.2" />
      {/* Ferramentas dentro */}
      <g transform="translate(12, 14.5)">
        {/* Seringa pequena */}
        <rect
          x="-3"
          y="-2"
          width="6"
          height="4"
          rx="0.5"
          fill="#8bc34a"
          stroke="#50624A"
          strokeWidth="0.5"
        />
        <circle cx="0" cy="0" r="0.8" fill="#ffffff" opacity="0.8" />
        {/* Lupa */}
        <circle cx="2" cy="-2" r="1.5" fill="none" stroke="#50624A" strokeWidth="1" />
        <path d="M3.2 -0.8L4.5 0.5" stroke="#50624A" strokeWidth="1" strokeLinecap="round" />
        {/* Luvas */}
        <path d="M-2 -1.5L-2.5 -2.5" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M2 -1.5L2.5 -2.5" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
      </g>
    </svg>
  ),
  default: (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="defaultGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8bc34a" />
          <stop offset="100%" stopColor="#7cb342" />
        </linearGradient>
      </defs>
      {/* Cogumelo genérico melhorado */}
      <path
        d="M12 2.5C8.5 2.5 6.5 4.5 6.5 7.5C6.5 10.5 8.5 12.5 12 12.5C15.5 12.5 17.5 10.5 17.5 7.5C17.5 4.5 15.5 2.5 12 2.5Z"
        fill="url(#defaultGrad)"
        stroke="#50624A"
        strokeWidth="1.5"
      />
      <path
        d="M10 7.5C10 7.5 10.3 9 11.5 9C12.7 9 13 7.5 13 7.5"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle cx="11" cy="6.5" r="0.5" fill="#ffffff" opacity="0.9" />
      <circle cx="13" cy="6.5" r="0.5" fill="#ffffff" opacity="0.9" />
      <path d="M12 12.5V17.5" stroke="#8B6F4A" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 17.5H15" stroke="#8B6F4A" strokeWidth="2" strokeLinecap="round" />
      {/* Detalhes decorativos */}
      <circle cx="10" cy="5" r="0.3" fill="#ffffff" opacity="0.6" />
      <circle cx="14" cy="5" r="0.3" fill="#ffffff" opacity="0.6" />
    </svg>
  ),
};
