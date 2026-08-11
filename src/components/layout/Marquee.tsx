'use client';

import { Lato } from 'next/font/google';
import { cn } from '@/lib/utils';

const lato = Lato({ subsets: ['latin'], weight: '400' });

export function Marquee({ messages }: { messages: string[] }) {
  if (!messages || messages.length === 0) return null;

  // Build a single "block" where every message has a leading bullet,
  // including the very first one — so the seam between loops is seamless.
  // e.g.  • MSG1   • MSG2   • MSG3
  const block = messages.map(m => `•   ${m}`).join('     ');

  // Duplicate twice: the animation scrolls exactly -50%, showing one copy
  // while the other is off-screen — fully seamless loop.
  const track = `${block}     ${block}`;

  return (
    <div
      className={cn(
        'w-full h-[45px] overflow-hidden flex items-center',
        'text-white text-[18px]',
        lato.className,
      )}
      style={{ backgroundColor: '#FF80B3' }}
    >
      <div
        className="flex shrink-0 whitespace-nowrap"
        style={{ animation: 'marquee-scroll 15s linear infinite' }}
      >
        {track}
      </div>
      {/* Inject keyframes via a style tag — safe in Next.js App Router client components */}
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
