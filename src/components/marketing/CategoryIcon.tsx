import Image from 'next/image'

interface CategoryIconProps {
  slug: string
  size?: number
  className?: string
}

// Map category slugs to their PNG icon files
const ICON_MAP: Record<string, string> = {
  'maquillaje':       '/icons/categories/makeup.png',
  'accesorios':       '/icons/categories/accesories.png',
  'cuidado-facial':   '/icons/categories/skincare.png',
  'cuidado-capilar':  '/icons/categories/haircare.png',
  // Keep fallbacks for any old slugs that might still exist:
  'maquillaje-y-accesorios':    '/icons/categories/makeup.png',
  'cuidado-facial-y-capilar':   '/icons/categories/skincare.png',
}

const DEFAULT_ICON = '/icons/categories/makeup.png'

export default function CategoryIcon({
  slug,
  size = 56,
  className = ''
}: CategoryIconProps) {
  const src = ICON_MAP[slug] ?? DEFAULT_ICON

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={`object-contain drop-shadow-sm ${className}`}
      aria-hidden="true"
    />
  )
}
