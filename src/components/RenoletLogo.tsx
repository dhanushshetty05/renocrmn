import React from 'react';

interface RenoletLogoProps {
  className?: string;
  height?: number | string;
  light?: boolean;
}

export const RenoletLogo: React.FC<RenoletLogoProps> = ({ className = '', height = 40, light = false }) => {
  // Use pure royal blue matching the user logo image, or white for dark backgrounds
  const color = light ? '#FFFFFF' : '#0020C2';

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 500 120" 
      className={className}
      style={{ height }}
    >
      {/* Gothic Arch Cathedral Vault Pillar Motif on Left */}
      <g transform="translate(10, 10)">
        <rect x="0" y="0" width="100" height="100" fill="none" />
        
        {/* Solid vertical side border pillars */}
        <path d="M0,0 H12 V100 H0 Z" fill={color} />
        <path d="M88,0 H100 V100 H88 Z" fill={color} />
        
        {/* Branching arch vault lines */}
        <path d="M12,0 C27,25 35,50 35,100 H25 C25,60 17,35 12,20 Z" fill={color} />
        <path d="M88,0 C73,25 65,50 65,100 H75 C75,60 83,35 88,20 Z" fill={color} />
        
        <path d="M12,35 C32,55 45,72 45,100 H35 C35,80 25,65 12,48 Z" fill={color} />
        <path d="M88,35 C68,55 55,72 55,100 H65 C65,80 75,65 88,48 Z" fill={color} />
        
        <path d="M0,0 C8,15 12,35 12,40 C12,30 8,15 0,8 Z" fill={color} />
        <path d="M100,0 C92,15 88,35 88,40 C88,30 92,15 100,8 Z" fill={color} />
        
        {/* Main gothic arches - concentric structure */}
        <path d="M20,100 V60 C20,38 50,18 50,18 C50,18 80,38 80,60 V100 H70 V60 C70,46 50,30 50,30 C50,30 30,46 30,60 V100 Z" fill={color} />
        <path d="M34,100 V74 C34,58 50,44 50,44 C50,44 66,58 66,74 V100 H56 V74 C56,66 50,57 50,57 C50,57 44,66 44,74 V100 Z" fill={color} />
        <path d="M42,100 V86 C42,80 50,73 50,73 C50,73 58,80 58,86 V100 H52 V86 C52,84 50,80 50,80 C50,80 48,84 48,86 V100 Z" fill={color} />
      </g>

      {/* Typography block matching RENOLET logo */}
      <g transform="translate(130, 20)">
        <text 
          x="0" 
          y="52" 
          fontFamily="'Inter', 'Outfit', 'Helvetica Neue', 'Arial', sans-serif" 
          fontSize="60" 
          fontWeight="800" 
          fill={color} 
          letterSpacing="-0.5px"
        >
          RENOLET
        </text>
        <text 
          x="2" 
          y="84" 
          fontFamily="'Inter', 'system-ui', sans-serif" 
          fontSize="17.5" 
          fontWeight="600" 
          fill={color} 
          letterSpacing="0.2px"
        >
          uPVC-Aluminium Windows and Doors
        </text>
      </g>
    </svg>
  );
};
