# Guía de Conexión: Supabase + Prisma 7

Esta guía documenta la solución al problema común de conexión (`P1001: Can't reach database server`) al integrar Supabase con Prisma 7, y explica cómo configurar correctamente las variables de entorno.

## 1. El Problema: IPv6 y el Error P1001
Recientemente, Supabase deshabilitó el soporte nativo de IPv4 para las conexiones directas a la base de datos (aquellas que apuntan al host `db.[tu-proyecto].supabase.co`). 

Si tu red local o proveedor de internet no soporta IPv6 (lo cual es muy común), Prisma fallará al intentar conectarse lanzando el error `P1001`.

## 2. La Solución: Usar Supavisor (Connection Pooler)
Para solucionar esto, debemos utilizar el enrutador intermedio de Supabase llamado **Supavisor (Connection Pooler)**. Este pooler expone un dominio diferente (`aws-0-[region].pooler.supabase.com`) que **sí soporta IPv4**.

Para que Prisma y Next.js funcionen sin problemas, necesitamos dos conexiones diferentes hacia el pooler:

### A. DATABASE_URL (Modo Transaction - Puerto 6543)
Se utiliza para las consultas regulares de tu aplicación (leer, crear, actualizar datos). Como es un entorno Serverless/Edge (Next.js), el modo "Transaction" mantiene las conexiones vivas y balancea la carga sin saturar la base de datos.
* **Puerto:** `6543`
* **Parámetro requerido:** `?pgbouncer=true` al final.

### B. DIRECT_URL (Modo Session - Puerto 5432)
Se utiliza **exclusivamente** para correr migraciones de Prisma (`npx prisma db push` o `npx prisma migrate dev`). Las migraciones requieren una conexión de estado prolongado (sesión) que el puerto 6543 no permite.
* **Puerto:** `5432`
* **Sin parámetros extra** al final.

## 3. Ejemplo de Configuración en `.env`

Tus variables en el archivo `.env` deben verse así:

```env
# URL para la app (Pooler modo Transaction)
DATABASE_URL="postgresql://postgres.[ref-proyecto]:[TU_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# URL para migraciones (Pooler modo Session)
DIRECT_URL="postgresql://postgres.[ref-proyecto]:[TU_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

## 4. Diferencia clave con Prisma 7
Si buscas tutoriales antiguos o sigues el asistente de Supabase, verás que te piden colocar esto en tu `prisma/schema.prisma`:

```prisma
// ❌ INCORRECTO EN PRISMA 7
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

En **Prisma 7**, los parámetros `url` y `directUrl` ya **NO** están permitidos dentro del archivo `schema.prisma`. 

En su lugar, el `schema.prisma` queda completamente limpio:
```prisma
// ✅ CORRECTO EN PRISMA 7
datasource db {
  provider = "postgresql"
}
```

La resolución de la conexión (leer el `.env`) ahora se maneja automáticamente a través del nuevo archivo `prisma.config.ts` en la raíz de tu proyecto.

## 5. Resumen del Flujo de Trabajo
1. Vas a Supabase -> **Connect** (botón superior).
2. Marcas **"Use connection pooling"**.
3. Copias la URL y la pegas en tu `.env` (puerto `6543` para `DATABASE_URL`, y puerto `5432` para `DIRECT_URL`).
4. Ejecutas `npx prisma db push` para subir la estructura a Supabase.
5. Ejecutas `npm run build` o `npm run dev` para levantar la aplicación.
