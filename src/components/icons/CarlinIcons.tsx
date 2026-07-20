// Ícono de búsqueda — lupa con detalle de brillo
export function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
      {/* detalle de brillo */}
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor"
        stroke="none" opacity="0.5" />
    </svg>
  )
}

// Ícono de carrito — bolsa con lazo
export function CartIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      {/* bolsa */}
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      {/* asas de la bolsa */}
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

// Ícono de perfil — silueta con estrella (para mayoristas)
export function ProfileIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      {/* estrella pequeña para indicar mayorista */}
      <path d="M18 2l.5 1.5L20 4l-1.5.5L18 6l-.5-1.5L16 4l1.5-.5z"
        fill="currentColor" stroke="none" />
    </svg>
  )
}
