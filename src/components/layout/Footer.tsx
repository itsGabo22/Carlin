import * as React from 'react';
import Link from 'next/link';
import { Mail, Phone, MessageCircle, MapPin } from 'lucide-react';

const CONTACT_EMAIL = 'erica0199@hotmail.com';
const CONTACT_PHONE = '317 441 7921';
const CONTACT_WHATSAPP = '573174417921';
const CONTACT_ADDRESS = 'Centro Comercial Galerías, Local 116';
const CONTACT_MAPS_URL = 'https://maps.app.goo.gl/73m2zLKr9inZLCox7?g_st=aw';

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z" />
    </svg>
  );
}

const CATALOG_LINKS = [
  { label: 'Maquillaje y Accesorios', href: '/catalogo/maquillaje-y-accesorios' },
  { label: 'Cuidado Facial y Capilar', href: '/catalogo/cuidado-facial-y-capilar' },
  { label: 'Ver todo', href: '/catalogo' },
  { label: 'Buscar', href: '/buscar' },
];

const WHOLESALE_LINKS = [
  { label: 'Registrarme', href: '/registro-mayorista' },
  { label: 'Iniciar sesión', href: '/mayoristas/login' },
  { label: 'Conoce los beneficios', href: '/mayoristas' },
];

const LEGAL_LINKS = [
  { label: 'Política de privacidad', href: '/legal/privacidad' },
  { label: 'Términos y condiciones', href: '/legal/terminos' },
];

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#', icon: <InstagramIcon size={18} /> },
  { label: 'TikTok', href: '#', icon: <TikTokIcon size={18} /> },
  { label: 'Facebook', href: '#', icon: <FacebookIcon size={18} /> },
];

export function Footer() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';

  return (
    <footer className="bg-[#3D1020] text-white/70 border-t border-brand-pink/20" aria-label="Pie de página">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* ── Col 1: Marca ──────────────────────────────── */}
          <div className="space-y-4">
            <Link href="/" className="inline-block leading-none">
              <span
                className="text-2xl text-brand-pink-light block"
                style={{ fontFamily: 'var(--font-pacifico, Pacifico, cursive)' }}
              >
                Carlin
              </span>
              <span className="font-nunito text-xs font-semibold tracking-widest text-brand-pink uppercase block -mt-1">
                Cosméticos
              </span>
            </Link>
            <p className="font-sans text-sm text-white/60 leading-relaxed max-w-xs">
              Catálogo mayorista de maquillaje, cuidado facial y accesorios. Precios especiales para mayoristas y distribuidores. Envíos a toda Colombia. 🚚
            </p>
            <div className="flex items-center gap-3 pt-2">
              {SOCIAL_LINKS.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex items-center justify-center h-9 w-9 rounded-full border border-brand-pink/30 text-brand-pink hover:bg-brand-pink/20 hover:border-brand-pink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── Col 2: Catálogo ────────────────────────────── */}
          <div>
            <h3 className="font-nunito text-xs font-bold tracking-widest text-brand-pink uppercase mb-4">
              Catálogo
            </h3>
            <ul className="space-y-2.5" role="list">
              {CATALOG_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-sans text-sm text-white/60 hover:text-brand-pink transition-colors focus-visible:outline-none rounded-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3: Mayoristas ──────────────────────────────── */}
          <div>
            <h3 className="font-nunito text-xs font-bold tracking-widest text-brand-pink uppercase mb-4">
              Mayoristas
            </h3>
            <ul className="space-y-2.5" role="list">
              {WHOLESALE_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-sans text-sm text-white/60 hover:text-brand-pink transition-colors focus-visible:outline-none rounded-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <span className="inline-block bg-brand-pink/15 border border-brand-pink/30 text-brand-pink rounded-full px-3 py-1 text-xs font-medium">
                🎀 Sin mínimo por referencia
              </span>
            </div>
          </div>

          {/* ── Col 4: Contacto ───────────────────────────── */}
          <div>
            <h3 className="font-nunito text-xs font-bold tracking-widest text-brand-pink uppercase mb-4">
              Contacto
            </h3>
            <ul className="space-y-3 font-sans text-sm text-white/60" role="list">
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 hover:text-brand-pink transition-colors">
                  <Mail size={16} className="text-brand-pink" />
                  <span>{CONTACT_EMAIL}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-brand-pink transition-colors">
                  <Phone size={16} className="text-brand-pink" />
                  <span>{CONTACT_PHONE}</span>
                </a>
              </li>
              <li>
                <a 
                  href={`https://wa.me/${CONTACT_WHATSAPP}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-brand-pink transition-colors"
                >
                  <MessageCircle size={16} className="text-brand-pink" />
                  <span>Escríbenos por WhatsApp</span>
                </a>
              </li>
              <li>
                <a 
                  href={CONTACT_MAPS_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 hover:text-brand-pink transition-colors"
                >
                  <MapPin size={16} className="text-brand-pink mt-0.5 flex-shrink-0" />
                  <span>{CONTACT_ADDRESS}</span>
                </a>
              </li>
            </ul>

            <div className="h-px w-full bg-brand-pink/20 my-5" />

            <ul className="flex flex-col gap-2 font-sans text-xs text-white/40">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-brand-pink transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
        </div>

        {/* ── Bottom bar ──────────────────────────────────── */}
        <div className="mt-8 border-t border-brand-pink/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs text-white/40">
          <p>
            © 2025 Carlin Cosméticos. Todos los derechos reservados.
          </p>
          <p>
            Hecho con 💄 en Colombia
          </p>
        </div>
      </div>
    </footer>
  );
}
