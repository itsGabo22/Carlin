'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto'),
  businessName: z.string().min(2, 'Nombre de negocio muy corto'),
  taxId: z.string().min(5, 'NIT o Cédula requerida'),
  phone: z.string().min(7, 'Teléfono inválido'),
  city: z.string().min(2, 'Ciudad requerida'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
  role: z.enum(['MAYORISTA', 'DISTRIBUIDOR']),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function RegistroMayoristaPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'MAYORISTA'
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setServerError('');
    
    try {
      const res = await fetch('/api/auth/registro-mayorista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ocurrió un error en el registro');
      }

      setSuccess(true);
    } catch (err: any) {
      setServerError(err.message);
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
        <h2 className="text-2xl font-nunito font-bold text-gray-900 mb-4">¡Solicitud recibida!</h2>
        <p className="text-gray-600 mb-8">
          Tu solicitud fue recibida correctamente. Estaremos revisando tus datos y te notificaremos por correo cuando tu cuenta sea aprobada para ver los precios especiales.
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
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-pink-light/20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-nunito font-bold text-gray-900 mb-2">Registro para Mayoristas</h1>
          <p className="text-gray-500">Completa tus datos para acceder a precios exclusivos.</p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
              <Input {...register('name')} className={errors.name ? 'border-red-500' : ''} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio *</label>
              <Input {...register('businessName')} className={errors.businessName ? 'border-red-500' : ''} />
              {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIT o Cédula *</label>
              <Input {...register('taxId')} className={errors.taxId ? 'border-red-500' : ''} />
              {errors.taxId && <p className="text-xs text-red-500 mt-1">{errors.taxId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
              <Input {...register('city')} className={errors.city ? 'border-red-500' : ''} />
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (WhatsApp) *</label>
              <Input {...register('phone')} className={errors.phone ? 'border-red-500' : ''} />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de cuenta *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col border rounded-xl p-4 cursor-pointer hover:border-brand-pink-light transition-colors has-[:checked]:border-brand-pink has-[:checked]:bg-brand-pink-light/5">
                <div className="flex items-center gap-2 mb-1">
                  <input type="radio" value="MAYORISTA" {...register('role')} className="text-brand-pink focus:ring-brand-pink accent-brand-pink" />
                  <span className="font-nunito font-bold text-gray-900">Mayorista</span>
                </div>
                <span className="text-xs text-gray-500 pl-6">Compras desde $200.000</span>
              </label>
              <label className="flex flex-col border rounded-xl p-4 cursor-pointer hover:border-brand-pink-light transition-colors has-[:checked]:border-brand-distributor has-[:checked]:bg-brand-distributor/5">
                <div className="flex items-center gap-2 mb-1">
                  <input type="radio" value="DISTRIBUIDOR" {...register('role')} className="text-brand-distributor focus:ring-brand-distributor accent-brand-distributor" />
                  <span className="font-nunito font-bold text-gray-900">Distribuidor</span>
                </div>
                <span className="text-xs text-gray-500 pl-6">Compras desde $400.000</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
                <Input type="email" {...register('email')} className={errors.email ? 'border-red-500' : ''} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <Input type="password" {...register('password')} className={errors.password ? 'border-red-500' : ''} />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña *</label>
                <Input type="password" {...register('confirmPassword')} className={errors.confirmPassword ? 'border-red-500' : ''} />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full bg-brand-pink-dark hover:bg-brand-pink text-white py-6 text-lg" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando solicitud...' : 'Enviar solicitud de registro'}
          </Button>

          <p className="text-center text-sm text-gray-500">
            ¿Ya tienes una cuenta? <Link href="/mayoristas/login" className="text-brand-pink hover:underline">Inicia sesión aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
