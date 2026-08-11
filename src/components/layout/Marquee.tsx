'use client';

import { Lato } from 'next/font/google';
import { cn } from '@/lib/utils';

const lato = Lato({ subsets: ['latin'], weight: '400' });

export function Marquee({ messages }: { messages: string[] }) {
  if (!messages || messages.length === 0) return null;

  // Build one "block" of spans — every message gets a leading bullet.
  // The block is duplicated once so the animation can scroll -50% seamlessly.
  // Using elements (not a plain string) lets us apply real CSS padding per item.
  const block = messages.map((m, i) => (
    <span key={i} style={{ padding: '0 36px' }}>
      <span style={{ marginRight: '12px', opacity: 0.8 }}>•</span>
      {m}
    </span>
  ));

  return (
    <div
      className={cn(
        'w-full h-[45px] overflow-hidden flex items-center',
        'text-white text-[18px]',
        lato.className,
      )}
      style={{ backgroundColor: '#FF80B3' }}
    >
      {/* Two identical copies side-by-side; animation translates -50% = one full copy */}
      <div
        className="flex shrink-0 whitespace-nowrap"
        style={{ animation: 'marquee-scroll 20s linear infinite' }}
      >
        {/* Copy A */}
        {block}
        {/* Copy B — identical, butts up against A to form seamless loop */}
        {messages.map((m, i) => (
          <span key={`b-${i}`} style={{ padding: '0 36px' }}>
            <span style={{ marginRight: '12px', opacity: 0.8 }}>•</span>
            {m}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
