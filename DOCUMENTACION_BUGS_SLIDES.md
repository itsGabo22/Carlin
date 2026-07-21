# Documentación Técnica: Bugs Críticos y Soluciones del Panel de Administración (Hero Slides)

Este documento contiene un registro técnico detallado sobre los problemas encontrados durante el desarrollo y estabilización del módulo de banners (Hero Slides) para **Carlin Cosméticos**. El objetivo de este documento es servir como guía arquitectónica para prevenir estos mismos errores al momento de reutilizar o clonar este panel administrativo en otros proyectos de comercio electrónico.

---

## 1. El Error 500 Silencioso por Permisos RLS (Supabase Storage)

### Síntoma
Al intentar subir una imagen nueva desde el panel de administración hacia el bucket de Supabase, la consola de red arrojaba un error `500 Internal Server Error`, y la carga fallaba. Originalmente, el sistema colapsaba sin dejar rastro de qué fallaba.

### Explicación Técnica (Causa Raíz)
En Supabase, el almacenamiento de archivos (Storage) está regido por políticas RLS (*Row Level Security*). Por defecto, aunque un bucket se configure como "Público", esa configuración solo aplica para operaciones de **lectura** (`SELECT`), permitiendo que cualquier persona vea las imágenes.

Sin embargo, las operaciones de **escritura** (`INSERT` / `UPDATE`) están estrictamente bloqueadas para solicitudes anónimas. Nuestro código intentaba usar el `NEXT_PUBLIC_SUPABASE_ANON_KEY` cuando no encontraba la llave de administración. Al hacerlo, la base de datos de Supabase rechazaba la subida por seguridad.

### Solución Implementada
1. **Manejo de Errores Explícito:** Se añadió validación en el bloque `upload()` para interceptar el error exacto y emitirlo por consola:
   ```typescript
   const { data, error } = await supabaseAdmin.storage.from('hero-media').upload(path, buffer, ...);
   if (error) {
       console.error('[HERO UPLOAD ERROR]', error.message);
       return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
   }
   ```
2. **Variable de Entorno Obligatoria:** Es un requerimiento estricto que el entorno de producción (Vercel) cuente con la variable `SUPABASE_SERVICE_ROLE_KEY`. Esta llave "maestra" se salta las reglas RLS y es la única forma segura de subir archivos desde un backend servidor a Supabase sin requerir la sesión de un usuario autenticado por GoTrue en el contexto de esa subida.

---

## 2. Destrucción Inadvertida de Datos en Operaciones PATCH

### Síntoma
El usuario subía un banner correctamente (con imagen y texto). Más tarde, al presionar "Editar" en el panel administrativo para cambiar únicamente el título (sin adjuntar la imagen nuevamente), la imagen desaparecía de la página principal.

### Explicación Técnica (Causa Raíz)
En el *App Router* de Next.js, nuestro endpoint `/api/admin/hero-slides/[id]/route.ts` recibía la data a través de un objeto `FormData`. 
El código original asignaba la URL de la imagen de esta forma:
```typescript
let desktopUrl = formData.get('desktopUrl') as string || '';
```
Si el usuario editaba el slide, el componente *frontend* de edición (Modal) enviaba el título, pero al no haberse modificado la imagen, el campo de archivo venía vacío. Como resultado, `desktopUrl` se evaluaba como `''` (cadena vacía) y el ORM de Prisma ejecutaba un `update` sobrescribiendo la URL válida que existía en la base de datos por un string vacío, rompiendo la imagen.

### Solución Implementada
El estándar para métodos `PATCH` (actualizaciones parciales) exige **siempre** consultar el estado actual del registro y usarlo como método de *fallback* si el campo no es proporcionado en el *payload* de la petición.

```typescript
// 1. Obtener registro actual
const existingSlide = await prisma.heroSlide.findUnique({ where: { id } });

// 2. Usar valores del form, y si están vacíos, rescatar los existentes
let desktopUrl = formData.get('desktopUrl') as string || existingSlide.desktopUrl;
let mobileUrl = formData.get('mobileUrl') as string || existingSlide.mobileUrl;
```

---

## 3. Conflictos de Stacking Contexts y Z-Index Negativos (La Pared Sólida)

### Síntoma
A pesar de que la base de datos tenía la URL de la imagen correcta, la página web (`HeroSection.tsx`) no mostraba la imagen, renderizando únicamente un color rosado sólido sobre todo el banner.

### Explicación Técnica (Causa Raíz)
El contenedor `<section>` principal tenía la clase `bg-brand-pink-dark`. Dentro de este, el wrapper de la imagen utilizaba la clase `-z-20`.
Según la especificación de CSS (*CSS Stacking Contexts*), si un elemento padre (el section) tiene `position: relative` pero NO establece su propio contexto de apilamiento explícito (por ejemplo, con `z-index: 0` o `isolate`), los hijos con *z-index negativo* (`-z-20`) se renderizan **detrás del fondo** de su contenedor bloque más cercano. 
Básicamente, la imagen se estaba dibujando físicamente por detrás de la capa de pintura rosada sólida del `<section>`.

### Solución Implementada
Se reorganizó la arquitectura de capas en Tailwind CSS para no depender de índices negativos al lidiar con fondos opacos:
- Fondo de color del `<section>` (opaco).
- Capa de imagen/video de fondo cambiada de `-z-20` a `z-0` (Para dibujar *encima* del fondo sólido).
- Contenido de texto y botones elevados a `z-10`.
- Controles manuales (flechas) elevados a `z-20`.

---

## 4. Fallos de Memoria y Dependencias con `sharp` en Serverless

### Síntoma
Errores en la compilación o colapsos 500 al momento de usar funciones Serverless en Vercel que contenían procesamiento masivo de imágenes.

### Explicación Técnica
La librería `sharp` requiere binarios compilados nativos según la arquitectura del sistema operativo (Linux, Windows, Darwin). En un entorno local funciona perfectamente, pero en el Edge/Serverless de Vercel puede causar fallos críticos si la dependencia no se define estrictamente o si supera los límites de memoria ligeros (50MB) de las funciones.

### Solución Implementada
Para los banners (Hero Slides), se prescindió del pre-procesamiento agresivo de imágenes con `sharp` en el backend, optando por aprovechar el componente `<picture>` del Frontend o dejando que el CDN optimice la entrega. Cuando subas imágenes desde el panel, si tu plataforma requiere compresión agresiva antes del upload, es preferible hacerlo mediante Canvas en el lado del cliente o usar soluciones nativas antes de disparar el endpoint para mantener el código de la API ligero y a prueba de caídas en Vercel.

---

## 5. El Router Cache de Next.js (La Falsa Alarma de Stale UI)

### Síntoma
Después de realizar una modificación exitosa en el panel administrativo y navegar de regreso a la tienda principal haciendo clic en enlaces internos, los banners no reflejaban el cambio.

### Explicación Técnica
Next.js 13+ implementa una caché multinivel muy agresiva.
Cuando la API realiza una subida exitosa, ejecuta `revalidatePath('/')`. Esto purga y recrea exitosamente el HTML estático en el *servidor*. Sin embargo, el navegador web mantiene activo el *Client-side Router Cache*. Esta es una memoria en la RAM del navegador (RSC payload) que Next.js guarda por 30 segundos (o 5 minutos para rutas estáticas) para navegar instantáneamente sin hacer solicitudes de red.

### Solución / Protocolo
Esto **no es un bug**, es una optimización fundamental del App Router de React/Next. 
Para pruebas técnicas, tras modificar un banner, si vas a la web y se ve desactualizado, el protocolo es ejecutar un **Hard Refresh (F5 / Cmd+R)**. Esto destruye la caché RAM del cliente y obliga al navegador a descargar el nuevo estado que el servidor ya actualizó.

---

### Resumen para Futuros Proyectos
Al portar este código a un nuevo e-commerce, asegúrate de aplicar el siguiente Check-list:
1. [ ] Crear `SUPABASE_SERVICE_ROLE_KEY` en producción desde el día 1.
2. [ ] Mantener el esquema de capas Z-index basado en `z-0` / `z-10` y evitar índices negativos absolutos.
3. [ ] Proteger siempre la sobrescritura de datos en endpoints PATCH usando el registro existente como base temporal.
4. [ ] Usar un único Singleton de Supabase SSR (`createBrowserClient` importado de `client.ts`) para evitar avisos de múltiples instancias `GoTrueClient` en el navegador.
