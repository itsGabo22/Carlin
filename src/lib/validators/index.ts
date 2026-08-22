import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  price: z.number().positive('El precio debe ser un número positivo'),
  categoryId: z.string(),
});

/// Compartido entre el formulario de /contacto (cliente) y POST /api/contacto
/// (servidor), para que ambos lados validen exactamente lo mismo.
export const ContactoSchema = z
  .object({
    name: z.string().min(2, 'Ingresa tu nombre'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().min(7, 'Teléfono inválido').optional().or(z.literal('')),
    message: z.string().min(10, 'Cuéntanos un poco más (mínimo 10 caracteres)'),
  })
  .refine((data) => !!data.email || !!data.phone, {
    message: 'Déjanos tu email o tu teléfono para poder responderte',
    path: ['email'],
  });

export type ContactoFormValues = z.infer<typeof ContactoSchema>;
