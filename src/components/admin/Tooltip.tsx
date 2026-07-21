import React from 'react';

export function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex items-center group ml-1">
      <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-500 text-[10px] flex items-center justify-center cursor-help hover:bg-brand-pink-light hover:text-brand-pink-dark transition-colors">
        ?
      </span>
      <span className="absolute left-6 top-0 z-50 w-56 p-2 bg-neutral-800 text-white text-xs rounded-lg leading-relaxed opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-lg">
        {text}
      </span>
    </span>
  );
}
