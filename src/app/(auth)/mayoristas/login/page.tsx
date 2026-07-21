'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setServerError('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw new Error('Credenciales incorrectas');
      }

      // Force router refresh so the server layout picks up the new session
      router.refresh();
      // Redirect to catalog or pending page (handled by server later or just push to catalog)
      router.push('/catalogo');
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-24 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-pink-light/20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-nunito font-bold text-gray-900 mb-2">Ingreso Mayoristas</h1>
          <p className="text-gray-500">Inicia sesión para ver tus precios especiales.</p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <Input type="email" {...register('email')} className={errors.email ? 'border-red-500' : ''} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <Input type="password" {...register('password')} className={errors.password ? 'border-red-500' : ''} />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full bg-brand-pink-dark hover:bg-brand-pink text-white py-6 text-lg" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </Button>

          <p className="text-center text-sm text-gray-500">
            ¿No tienes cuenta? <Link href="/registro-mayorista" className="text-brand-pink hover:underline">Regístrate aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
