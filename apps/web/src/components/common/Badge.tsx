import React from 'react';
import '../../styles/legacy/components/common/Badge.css';

export type BadgeType =
  | 'premiado'
  | 'promocao'
  | 'novo'
  | 'destaque'
  | 'mais-vendido'
  | 'cultivo-facil'
  | 'alta-potencia'
  | 'default';

interface BadgeProps {
  label: string;
  type?: BadgeType | string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ label, type = 'default', className = '' }) => {
  return <span className={`badge badge-${type} ${className}`}>{label}</span>;
};

export default Badge;
