import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  textSuffix?: string;
  invert?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  textSuffix = '',
  invert = false,
}) => {
  const sizeMap = {
    sm: { width: 100, height: 36 },
    md: { width: 128, height: 46 },
    lg: { width: 176, height: 63 },
    xl: { width: 216, height: 77 },
  };

  const dimensions = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 shrink-0 ${invert ? 'rounded-xl bg-[#FFF4E5] px-1 py-0.5' : ''} ${className}`}>
      <img
        src="/favicon.svg"
        alt="Tastifyy"
        draggable={false}
        className="shrink-0 object-cover object-center"
        style={dimensions}
      />
      {textSuffix && (
        <span className="text-xs sm:text-sm font-bold text-gray-700">{textSuffix}</span>
      )}
    </div>
  );
};
