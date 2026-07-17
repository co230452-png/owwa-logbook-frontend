import React from 'react';

interface OWWALogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
}

const OWWALogo: React.FC<OWWALogoProps> = ({ size = 'md', variant = 'full', className = '' }) => {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-sm', sub: 'text-xs' },
    md: { icon: 'w-10 h-10', text: 'text-base', sub: 'text-xs' },
    lg: { icon: 'w-14 h-14', text: 'text-xl', sub: 'text-sm' },
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* OWWA Shield Icon */}
      <div className={`${sizes[size].icon} relative flex-shrink-0`}>
        <img
        src="/owwa-logo.jpg"
        alt="OWWA Logo"
        className="w-full h-full object-contain"
        />
      </div>

      {variant === 'full' && (
        <div className="flex flex-col leading-tight">
          <span className={`${sizes[size].text} font-bold text-blue-800`}>OWWA</span>
          <span className={`${sizes[size].sub} text-gray-500 font-medium`}>Region IX</span>
        </div>
      )}
    </div>
  );
};

export default OWWALogo;
