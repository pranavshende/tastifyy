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
    sm: { box: 'w-8 h-8 rounded-lg', text: 'text-sm', letter: 'text-base' },
    md: { box: 'w-10 h-10 rounded-xl', text: 'text-xl', letter: 'text-xl' },
    lg: { box: 'w-12 h-12 rounded-[14px]', text: 'text-2xl', letter: 'text-2xl' },
    xl: { box: 'w-16 h-16 rounded-2xl', text: 'text-3xl', letter: 'text-3xl' }
  };

  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 shrink-0 ${className}`}>
      <div className={`${s.box} ${invert ? 'bg-white text-brand-primary shadow-white/30' : 'bg-brand-primary text-white shadow-brand-primary/30'} flex items-center justify-center shadow-lg shrink-0`}>
        <span className={`font-black ${s.letter} leading-none block`}>T</span>
      </div>
      {showText && (
        <span className={`font-black tracking-tight ${s.text} ${textColor}`}>
          Tastifyy {textSuffix && <span className="font-bold opacity-80 text-base">{textSuffix}</span>}
        </span>
      )}
    </div>
  );
};
