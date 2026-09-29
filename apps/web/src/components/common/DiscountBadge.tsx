import React from 'react';
import { discountPercent } from '@mingo/shared';
import '../../styles/legacy/components/common/DiscountBadge.css';

interface DiscountBadgeProps {
  priceCents: number;
  salePriceCents: number;
  className?: string;
}

const DiscountBadge: React.FC<DiscountBadgeProps> = ({
  priceCents,
  salePriceCents,
  className = '',
}) => {
  const percent = discountPercent({ priceCents, salePriceCents });

  if (percent <= 0) {
    return null;
  }

  return <div className={`discount-badge ${className}`}>-{percent}%</div>;
};

export default DiscountBadge;
