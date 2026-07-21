import React from 'react';

interface FieldHintProps {
  text: string;
  type?: 'info' | 'warning' | 'tip';
}

export function FieldHint({ text, type = 'info' }: FieldHintProps) {
  const colors = {
    info: 'text-neutral-400 bg-neutral-50 border-neutral-200',
    warning: 'text-amber-600 bg-amber-50 border-amber-200',
    tip: 'text-brand-pink-dark bg-brand-pink-light/40 border-brand-pink/20',
  };
  
  return (
    <p className={`text-xs px-2 py-1 rounded-lg border mt-1 leading-relaxed ${colors[type]}`}>
      {text}
    </p>
  );
}
