import React from 'react';
import { SvgIcon } from '@mui/material';

function MedalSvgIcon(props: any) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" sx={{ width: 40, height: 40 }}>
      <g>
        <circle cx="12" cy="12" r="6" fill="gold" />
        <circle cx="12" cy="12" r="5.5" fill="none" stroke="darkgoldenrod" strokeWidth="1" />
        <path 
          d="M12 6v4" 
          stroke="darkgoldenrod" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        <path 
          d="M12 10h4" 
          stroke="darkgoldenrod" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        <path 
          d="M12 18l-4 6h8z" 
          fill="none" 
          stroke="darkgoldenrod" 
          strokeWidth="1.5"
        />
      </g>
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animated-medal {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </SvgIcon>
  );
}

export default MedalSvgIcon;
