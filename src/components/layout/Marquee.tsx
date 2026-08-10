'use client';

import { Lato } from 'next/font/google';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const lato = Lato({ subsets: ['latin'], weight: '400' });

export function Marquee({ messages }: { messages: string[] }) {
  if (!messages || messages.length === 0) return null;

  // The text needs to be duplicated a few times to ensure seamless scrolling
  const scrollText = messages.join('    •    ');
  // Duplicate it to ensure we can scroll infinitely without gaps
  const duplicatedContent = Array(4).fill(scrollText);

  return (
    <div className={cn(
      "w-full h-[45px] overflow-hidden flex items-center whitespace-nowrap",
      "text-white uppercase text-[18px]",
      lato.className
    )}
    style={{ backgroundColor: '#FF80B3' }}
    >
      <div 
        className="flex"
        style={{ animation: 'marquee 15s linear infinite' }}
      >
        {duplicatedContent.map((text, i) => (
          <span key={i} className="pr-[30px] shrink-0">
            {text}
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
