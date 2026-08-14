'use client';

import { lato } from '@/lib/fonts';
import { cn } from '@/lib/utils';

export function Marquee({ messages }: { messages: string[] }) {
  if (!messages || messages.length === 0) return null;

  // Render items with bullet and padding
  const renderItems = (prefix: string) =>
    messages.map((m, i) => (
      <span key={`${prefix}-${i}`} className="inline-flex items-center px-8 shrink-0">
        <span className="mr-3 opacity-80">•</span>
        {m}
      </span>
    ));

  return (
    <div
      className={cn(
        'w-full h-[45px] overflow-hidden flex items-center relative',
        'text-white text-[18px]',
        lato.className,
      )}
      style={{ backgroundColor: '#FF80B3' }}
    >
      {/* Container with two identical Tracks (A & B); translating -50% creates a 100% seamless infinite loop */}
      <div
        className="flex shrink-0 whitespace-nowrap"
        style={{ animation: 'marquee-scroll 25s linear infinite' }}
      >
        {/* Track A — 4x repeats ensure Track width > viewport on 4K screens */}
        <div className="flex shrink-0">
          {renderItems('a1')}
          {renderItems('a2')}
          {renderItems('a3')}
          {renderItems('a4')}
        </div>
        {/* Track B — 100% identical copy of Track A */}
        <div className="flex shrink-0">
          {renderItems('b1')}
          {renderItems('b2')}
          {renderItems('b3')}
          {renderItems('b4')}
        </div>
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
