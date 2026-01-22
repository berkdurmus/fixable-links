import React from 'react';

interface PlsfixIconProps {
  size?: number;
}

export const PlsfixIcon: React.FC<PlsfixIconProps> = ({ size = 24 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Pink blob character - simplified Jam mascot style */}
      <ellipse cx="10" cy="16" rx="8" ry="10" fill="#FF6B9D" />
      <ellipse cx="22" cy="16" rx="8" ry="10" fill="#FF6B9D" />
      {/* Eyes */}
      <circle cx="8" cy="14" r="2" fill="white" />
      <circle cx="12" cy="14" r="2" fill="white" />
      <circle cx="8" cy="14" r="1" fill="#130F18" />
      <circle cx="12" cy="14" r="1" fill="#130F18" />
      {/* Second character eyes */}
      <circle cx="20" cy="14" r="2" fill="white" />
      <circle cx="24" cy="14" r="2" fill="white" />
      <circle cx="20" cy="14" r="1" fill="#130F18" />
      <circle cx="24" cy="14" r="1" fill="#130F18" />
      {/* Small decorative element */}
      <circle cx="16" cy="8" r="3" fill="#4AE3B5" />
    </svg>
  );
};
