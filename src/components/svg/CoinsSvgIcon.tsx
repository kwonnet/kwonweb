import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

function CoinsSvgIcon(props: any) {
  return (
    <SvgIcon {...props}>
      {/* Bottom Coin */}
      <ellipse
        cx="12"
        cy="18"
        rx="10"
        ry="3"
        fill="url(#coinGradient1)"
      />
      <path
        d="M2,18a10,3 0 0,0 20,0v1a10,3 0 0,1-20,0z"
        fill="#031d37"
        opacity="0.5"
      />

      {/* Middle Coin */}
      <ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="2.7"
        fill="url(#coinGradient2)"
      />
      <path
        d="M3,12a9,2.7 0 0,0 18,0v1a9,2.7 0 0,1-18,0z"
        fill="#031d37"
        opacity="0.5"
      />

      {/* Top Coin */}
      <ellipse
        cx="12"
        cy="6"
        rx="8"
        ry="2.4"
        fill="url(#coinGradient3)"
      />
      <path
        d="M4,6a8,2.4 0 0,0 16,0v1a8,2.4 0 0,1-16,0z"
        fill="#031d37"
        opacity="0.5"
      />

      {/* Dollar Signs */}
      <text
        x="12"
        y="6"
        textAnchor="middle"
        fill="white"
        fontSize="4"
        fontWeight="bold"
        dy=".3em"
      >
        $
      </text>
      <text
        x="12"
        y="12"
        textAnchor="middle"
        fill="white"
        fontSize="4"
        fontWeight="bold"
        dy=".3em"
      >
        $
      </text>
      <text
        x="12"
        y="18"
        textAnchor="middle"
        fill="white"
        fontSize="4"
        fontWeight="bold"
        dy=".3em"
      >
        $
      </text>

      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="coinGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FFC107', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="coinGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFC107', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FFA000', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="coinGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFA000', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FF8F00', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
    </SvgIcon>
  );
}

export default CoinsSvgIcon;
