import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function Logo({ className = "", size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { container: 'w-8 h-8', text: 'text-lg', icon: 'w-4 h-4' },
    md: { container: 'w-10 h-10', text: 'text-xl', icon: 'w-5 h-5' },
    lg: { container: 'w-14 h-14', text: 'text-3xl', icon: 'w-7 h-7' },
    xl: { container: 'w-20 h-20', text: 'text-5xl', icon: 'w-10 h-10' }
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-3 group ${className}`}>
      <div className={`relative ${currentSize.container} flex-shrink-0`}>
        {/* Wax Seal Base */}
        <motion.div 
          initial={false}
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="absolute inset-0 bg-[#C5A059] rounded-full shadow-[0_4px_12px_rgba(197,160,89,0.3)] flex items-center justify-center overflow-hidden"
        >
          {/* Wax Texture / Border */}
          <div className="absolute inset-0.5 rounded-full border-2 border-[#B48E48] opacity-40" />
          <div className="absolute inset-1 rounded-full border border-[#D4AF37] opacity-20" />
          
          {/* 'K' Monogram with Pen Nib Detail */}
          <div className="relative flex items-center justify-center">
            <span className="font-monogram font-black text-[#F9F9F7] select-none leading-none transform translate-y-[5%]">
              <span className="relative inline-block">
                K
                {/* Fountain Pen Nib Detail on the vertical line of K */}
                <div className="absolute left-[15%] top-[10%] bottom-[10%] w-[12%] bg-[#F9F9F7] rounded-full opacity-20 blur-[1px]" />
                <div className="absolute left-[18%] top-[15%] w-[6%] h-[15%] bg-[#F9F9F7] rounded-full transform -translate-x-1/2" />
              </span>
            </span>
            
            {/* Subtle Pen Nib Tip at the bottom of the first vertical stroke */}
            <div className="absolute left-[18%] bottom-[15%] w-0 h-0 border-l-[2px] border-l-transparent border-r-[2px] border-r-transparent border-t-[4px] border-t-[#F9F9F7] transform -translate-x-1/2 rotate-180 opacity-80" />
          </div>
        </motion.div>
        
        {/* Outer Glow */}
        <div className="absolute inset-0 rounded-full bg-brand-accent/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${currentSize.text} font-black tracking-tighter uppercase text-brand-primary font-display leading-none`}>
            Karya
          </h1>
        </div>
      )}
    </div>
  );
}
