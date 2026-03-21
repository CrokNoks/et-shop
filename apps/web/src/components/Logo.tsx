import React from 'react';

interface LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const Logo: React.FC<LogoProps> = ({ className, width = 250, height = 80 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 250 80"
      width={width}
      height={height}
      className={className}
    >
      <defs>
        <style>
          {`
            .blue-text { fill: #1A365D; }
            .orange-accent { fill: #FF6B35; }
            .text-font { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: bold; }
          `}
        </style>
      </defs>

      <g id="icon-cart-propulsion" transform="translate(10, 15)">
        <line x1="0" y1="15" x2="15" y2="15" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" />
        <line x1="5" y1="25" x2="20" y2="25" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" />
        <line x1="0" y1="35" x2="15" y2="35" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" />

        <g transform="translate(25, 0) rotate(5, 20, 25)">
          <path d="M5,10 H35 L30,40 H10 Z" fill="none" stroke="#1A365D" strokeWidth="3" strokeLinejoin="round" />
          <path d="M15,10 C15,0 25,0 25,10" fill="none" stroke="#1A365D" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="20" x2="33" y2="20" stroke="#1A365D" strokeWidth="2" opacity="0.6" />
          <line x1="10" y1="30" x2="30" y2="30" stroke="#1A365D" strokeWidth="2" opacity="0.6" />
          <line x1="20" y1="10" x2="18" y2="40" stroke="#1A365D" strokeWidth="2" opacity="0.6" />
        </g>
      </g>

      <g id="text-brand" transform="translate(85, 52)">
        <text x="0" y="0" className="blue-text text-font" fontSize="36">Et SH</text>
        <text x="98" y="0" className="orange-accent text-font" fontSize="36">op</text>
        <text x="145" y="0" className="orange-accent text-font" fontSize="42">!</text>
      </g>
    </svg>
  );
};
