'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ContactoSchema, type ContactoFormValues } from '@/lib/validators';

export default function ContactoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactoFormValues>({
    resolver: zodResolver(ContactoSchema),
  });

  const onSubmit = async (data: ContactoFormValues) => {
    setIsSubmitting(true);
    setServerError('');

    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ocurrió un error al enviar tu mensaje');
      }

      setSuccess(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Ocurrió un error al enviar tu mensaje');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <div className="bg-brand-pink-light/20 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-brand-pink-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">¡Mensaje enviado!</h2>
        <p className="text-gray-600 mb-8">
          Recibimos tu mensaje y te responderemos lo antes posible.
        </p>
        <Link href="/">
          <Button className="w-full bg-brand-pink hover:bg-brand-pink-dark text-white">
            Volver a la tienda
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <main>
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-8 text-center">
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-brand-pink-dark mb-4">Contacto</h1>
        <p className="font-sans text-gray-600 text-lg max-w-2xl mx-auto">
          ¿Tienes una pregunta o quieres saber más sobre nuestros productos? Escríbenos y te responderemos pronto.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-brand-pink-dark shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600">carlincosmeticos@hotmail.com</span>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-brand-pink-dark shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600">317 441 7921</span>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-brand-pink-dark shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600">Centro Comercial Galerías, Local 116</span>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-brand-pink-light/20">
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <Input {...register('name')} className={errors.name ? 'border-red-500' : ''} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <Input type="email" {...register('email')} className={errors.email ? 'border-red-500' : ''} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <Input {...register('phone')} className={errors.phone ? 'border-red-500' : ''} />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
              </div>
            </div>
            <p className="text-xs text-gray-400 -mt-2">Déjanos al menos un correo o un teléfono para poder responderte.</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
              <Textarea {...register('message')} className={errors.message ? 'border-red-500' : ''} />
              {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-pink-dark hover:bg-brand-pink text-white py-6 text-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
