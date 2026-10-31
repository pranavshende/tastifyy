import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  textSuffix?: string;
  invert?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  showText = true, 
  textColor = 'text-gray-900', 
  textSuffix = '', 
  invert = false 
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg', text: 'text-sm sm:text-base', letter: 'text-sm' },
    md: { box: 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl', text: 'text-base sm:text-lg', letter: 'text-base' },
    lg: { box: 'w-10 h-10 sm:w-12 sm:h-12 rounded-[14px]', text: 'text-xl sm:text-2xl', letter: 'text-xl' },
    xl: { box: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl', text: 'text-2xl sm:text-3xl', letter: 'text-2xl' }
  };

  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 shrink-0 ${className}`}>
      <div className={`${s.box} ${invert ? 'shadow-white/30' : 'shadow-brand-primary/20'} flex items-center justify-center shadow-md shrink-0 overflow-hidden`}>
        <img src="/android-icon.png" alt="Tastifyy Logo" className="w-full h-full object-cover" />
      </div>
      {showText && (
        <span className={`font-black tracking-tight ${s.text} ${textColor}`}>
          Tastifyy{textSuffix ? <span className="font-bold opacity-80 ml-1 text-xs sm:text-sm">{textSuffix}</span> : null}
        </span>
      )}
    </div>
  );
};
