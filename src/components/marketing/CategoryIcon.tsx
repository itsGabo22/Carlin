import Image from 'next/image'

interface CategoryIconProps {
  slug: string
  size?: number
  className?: string
}

// Slugs que tienen ícono personalizado
const ICON_SLUGS = [
  'maquillaje-y-accesorios',
  'cuidado-facial-y-capilar',
  'ojos',
  'labios',
  'rostro',
  'brochas-y-herramientas',
  'accesorios-cosmeticos',
  'facial-por-marca',
  'capilar-por-marca',
]

export default function CategoryIcon({
  slug, size = 32, className = ''
}: CategoryIconProps) {
  const hasIcon = ICON_SLUGS.includes(slug)
  const src = `/icons/categories/${hasIcon ? slug : 'maquillaje-y-accesorios'}.svg`

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={className}
      aria-hidden="true"
    />
  )
}
