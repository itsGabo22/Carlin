'use client';
import { useScroll } from 'framer-motion';

export function usePageScroll() {
  const { scrollY } = useScroll();
  return scrollY;
}
