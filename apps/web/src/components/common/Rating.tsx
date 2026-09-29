import React from 'react';
import '../../styles/legacy/components/common/Rating.css';

interface RatingProps {
  rating: number;
  reviewCount?: number;
  showCount?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Rating: React.FC<RatingProps> = ({
  rating,
  reviewCount = 0,
  showCount = true,
  size = 'medium',
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`rating rating-${size}`}>
      <div className="rating-stars">
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`full-${i}`} className="star star-full">
            ★
          </span>
        ))}
        {hasHalfStar && <span className="star star-half">★</span>}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`empty-${i}`} className="star star-empty">
            ☆
          </span>
        ))}
      </div>
      {showCount && reviewCount > 0 && <span className="rating-count">({reviewCount})</span>}
    </div>
  );
};

export default Rating;
