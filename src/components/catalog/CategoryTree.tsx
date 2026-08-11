'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TreeNode {
  id: string;
  name: string;
  href: string;
  children: TreeNode[];
}

/**
 * Árbol lateral de categorías con la profundidad real del catálogo
 * (hoy hasta 3 niveles: Maquillaje > Ojos > Sombras).
 *
 * Las ramas que contienen la categoría activa arrancan abiertas; el resto
 * colapsadas. Cada nodo enlaza a su URL completa.
 */
function TreeItem({
  node,
  activeIds,
  depth,
}: {
  node: TreeNode;
  activeIds: Set<string>;
  depth: number;
}) {
  const enRamaActiva = activeIds.has(node.id);
  const [abierto, setAbierto] = useState(enRamaActiva);
  const tieneHijas = node.children.length > 0;
  // El último id del set es la categoría que se está viendo.
  const esActual = enRamaActiva && node.children.every((c) => !activeIds.has(c.id));

  return (
    <li>
      <div className="flex items-center gap-1">
        {tieneHijas ? (
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-label={abierto ? `Contraer ${node.name}` : `Expandir ${node.name}`}
            className="rounded p-0.5 text-brand-text/50 transition-colors hover:text-brand-pink-dark"
          >
            <ChevronRight
              size={14}
              className={cn('transition-transform duration-200', abierto && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="w-[22px]" aria-hidden />
        )}

        <Link
          href={node.href}
          aria-current={esActual ? 'page' : undefined}
          className={cn(
            'flex-1 rounded px-1 py-1.5 text-sm transition-colors',
            esActual
              ? 'font-bold text-brand-pink-dark'
              : enRamaActiva
                ? 'font-semibold text-brand-neutral-dark hover:text-brand-pink-dark'
                : 'text-brand-text hover:text-brand-pink-dark',
          )}
        >
          {node.name}
        </Link>
      </div>

      {tieneHijas && abierto && (
        <ul className={cn('mt-0.5 space-y-0.5 border-l border-brand-cream', depth === 0 ? 'ml-2 pl-2' : 'ml-3 pl-2')}>
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} activeIds={activeIds} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategoryTree({
  nodes,
  activeIds,
}: {
  nodes: TreeNode[];
  activeIds: string[];
}) {
  const set = new Set(activeIds);
  return (
    <ul className="space-y-0.5">
      {nodes.map((n) => (
        <TreeItem key={n.id} node={n} activeIds={set} depth={0} />
      ))}
    </ul>
  );
}
