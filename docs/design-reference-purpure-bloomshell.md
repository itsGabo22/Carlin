# Referencia de diseño — Purpure & Bloomshell (CARLIN)

Documento de **especificación** para el rediseño de CARLIN Cosméticos.
Fase 1: investigación. **No contiene código de aplicación.**

- **Fecha de extracción:** 2026-08-10
- **Método:** valores computados reales (`getComputedStyle`, `getBoundingClientRect`, CSSOM)
  leídos en el navegador sobre los sitios en vivo. No son aproximaciones ni muestreo de píxeles.
- **Viewport de referencia:** 1536×816 (escritorio)

Reparto de responsabilidades acordado con el cliente:

| Fuente | Qué se copia |
|---|---|
| **purpuremakeup.com** | Estructura y comportamiento del nav + marquee superior |
| **bloomshell.co** | Paleta de color, estructura de página, catálogo/filtros, sistema categoría→subcategoría |

> ⚠️ **Leer la sección 5 (Discrepancias) antes de implementar.** Dos supuestos del brief
> no coinciden con lo que hace el sitio real.

---

## 1. Paleta de color de Bloomshell

### 1.1 Colores principales

| Rol | Hex | Dónde se usa exactamente |
|---|---|---|
| **Primario (marca)** | `#F0A0C6` | Fondo de botones `a.button` / "AÑADIR AL CARRITO"; badge contador del carrito; badge del buscador. Es el color con más superficie pintada del sitio (55 elementos). |
| **Primario oscuro (hover / énfasis)** | `#E58EC7` | `button.single_add_to_cart_button` (ficha de producto) y botón del footer del carrito lateral. Usar como estado hover del primario. |
| **Acento brillante (barras)** | `#FFBBEC` | Barra de anuncio superior (63 px) y banda "TU BELLEZA FLORECE AQUÍ" (71 px). Rosa más saturado y claro que el primario. |
| **Overlay de categorías** | `#F09FC5` | `.pp-image-overlay` sobre los mosaicos de categoría, y fondo del footer "LÍNEAS DE ATENCIÓN" (276 px). Prácticamente idéntico al primario (1 unidad de diferencia); en la práctica **son el mismo color de marca**. |
| **Rosa muy claro (fondos suaves)** | `#FDECF5` | Barra de copyright (55 px) y **borde de las tarjetas de producto** (`0.8px solid #FDECF5`). |
| **Rosa claro alterno** | `#FCE7F1` | Fondos de sección secundarios. |

### 1.2 Fondos

| Rol | Hex |
|---|---|
| Fondo principal de página (`body`) | `#FFFFFF` |
| Fondo de la barra de nav | `#FFFFFF` |
| Fondo de tarjeta de producto | `#FFFFFF` |
| Grises del carrito lateral | `#F8F9FA`, `#EEEEEE` |

### 1.3 Texto

| Rol | Hex | Tipografía |
|---|---|---|
| **Títulos (h1)** | `#333333` | `Cormorant Garamond`, 34 px, peso 400 — serif elegante |
| **Títulos de tarjeta (h2)** | `#333333` | `DM Sans`, 15 px, peso 400 |
| **Cuerpo / precios** | `#6D6D6D` | `DM Sans`, 14 px, peso 400 |
| **Links del nav** | `#666666` | `DM Sans`, 14 px, peso 500 |
| **Texto sobre barras rosadas** | `#FFFFFF` | `DM Sans`, 22.65 px, peso 400 |
| **Títulos sobre imagen (h3)** | `#FFFFFF` | `DM Sans`, 25.9 px, peso 600 |

**Par tipográfico de Bloomshell:** `Cormorant Garamond` (serif, solo títulos grandes) + `DM Sans` (sans, todo lo demás).

### 1.4 Mapa de secciones de la home (orden vertical real)

| Posición Y | Alto | Fondo | Contenido |
|---|---|---|---|
| 0 | 63 px | `#FFBBEC` | Barra de anuncio |
| 63 | 72 px | `#FFFFFF` | Nav |
| 735 | 658 px | `#FFFFFF` | "ÚLTIMOS LANZAMIENTOS" |
| 4847 | 71 px | `#FFBBEC` | "TU BELLEZA FLORECE AQUÍ" |
| 4919 | 276 px | `#F09FC5` | Footer "LÍNEAS DE ATENCIÓN" |
| 5195 | 55 px | `#FDECF5` | Copyright |

**Lectura para CARLIN:** el sitio es blanco con rosa como acento, no rosa de fondo. El rosa aparece en
franjas horizontales completas (anuncio, banda, footer) y en los CTA. Los textos nunca son negro puro.

---

## 2. Marquee superior de Purpure (el "banner que se mueve constantemente")

Este es el elemento que el cliente confirmó por captura. **Verificado: es un marquee CSS infinito, no un carrusel.**

### 2.1 Colores y medidas

| Propiedad | Valor |
|---|---|
| Fondo de la barra | **`#FF80B3`** |
| Color del texto | **`#FFFFFF`** |
| Alto de la barra | **45 px** |
| `overflow` | `hidden` |
| Tamaño de fuente | **18 px** |
| Peso | **400** (normal) |
| Familia | `Lato` |
| `letter-spacing` | `normal` |
| `white-space` | `nowrap` |

**Relación con el resto del nav:** el texto del marquee (18 px) es **más grande** que los links de
categorías de la fila 2 (14 px). El marquee usa peso normal, no negrita — se lee fuerte por el
contraste blanco sobre rosa y por las mayúsculas, no por el peso.

> El color `#FF80B3` del marquee es **el mismo** que el de la fila 2 de categorías del nav.
> Las dos franjas rosadas de Purpure comparten color exacto.

### 2.2 Técnica — animación CSS por keyframes (no JS)

Tema Shopify T4S. Clases: `.t4s-announcement-bar--desgign-marquee` › `.t4s-marquee__item`.

```css
@keyframes marquee {
  0%   { transform: translate(0%); }
  100% { transform: translate(-100%); }
}
```

Valores computados sobre cada `.t4s-marquee__item`:

| Propiedad | Valor |
|---|---|
| `animation-name` | `marquee` |
| `animation-duration` | **15 s** |
| `animation-timing-function` | **`linear`** |
| `animation-iteration-count` | **`infinite`** |
| `animation-direction` | `normal` |

### 2.3 Estructura que produce el bucle sin salto

- **4 pistas** `.t4s-marquee__item` en total: 1 original + **3 duplicados** (`.t4s-marquee--duplicate`).
- Cada pista mide **628 px** de ancho y se coloca cada **638 px** (628 + 10 px de separación).
- Cada pista contiene **2 frases** en `<div>` separados:
  `@PURPUREMAKEUP` y `TU TIENDA DE MAQUILLAJE FAVORITA`.
- La viñeta `•` que separa las frases es decoración del ítem, no texto suelto.

### 2.4 Confirmación de que no hay salto visible — verificado empíricamente

- Separación entre las 4 pistas medida en vivo: **638 / 638 / 638 px** — constante, sin huecos.
- Las 4 animaciones reportan `playState: "running"` con **`currentTime` idéntico** (mismo valor exacto
  en las 4), es decir avanzan en bloque perfectamente sincronizadas.
- Como cada pista se desplaza exactamente **-100 % de su propio ancho** y están equiespaciadas,
  al completar el ciclo la composición es idéntica píxel a píxel al estado inicial. **El bucle es
  continuo por construcción, no por ajuste manual de tiempos.**

### 2.5 Cómo replicarlo en CARLIN (Tailwind v4 + `@theme`)

Receta mínima equivalente, sin librerías:

1. Contenedor con `overflow: hidden` y el fondo de marca.
2. Una fila flex con **N copias idénticas** del bloque de frases (mínimo 2; Purpure usa 4).
3. Animar el conjunto con `translateX(0 → -100%)`, `linear`, `infinite`.
4. Duración: **15 s** para ~628 px de contenido. Si el bloque de CARLIN es más ancho,
   **escalar la duración proporcionalmente** para conservar la misma velocidad percibida
   (≈ 42 px/s).
5. Añadir `@media (prefers-reduced-motion: reduce) { animation: none }` — Purpure no lo hace,
   pero es accesibilidad básica y no cuesta nada.

---

## 3. Sistema categoría → subcategoría de Bloomshell

Página analizada: `https://bloomshell.co/product-category/maquillaje/`

### 3.1 Los círculos de subcategoría — esto es lo que el cliente quiere

Van **debajo del título de la categoría y encima del grid de productos**, en fila horizontal.

| Propiedad | Valor |
|---|---|
| Elemento | `div.pp-category__img` |
| Medida renderizada | **140 × 140 px** |
| `border-radius` | **122 px** (círculo perfecto en la práctica) |
| `overflow` | `hidden` |
| Imagen fuente | **300 × 266 px** (no cuadrada — el círculo la recorta) |
| Separación entre círculos | **171 px** (140 de ancho + 31 de gap) |
| Alto del slide completo | **172 px** (140 del círculo + etiqueta debajo) |
| Ancho del slide | 140–141 px |

**Es un carrusel Swiper**, no una fila estática: las clases son `swiper-slide` dentro de
`swiper-wrapper`. En escritorio se ven **~5 círculos a la vez** y el resto se desplaza
horizontalmente. La etiqueta de texto va **debajo** del círculo, en mayúsculas.

### 3.2 Qué pasa al hacer clic — navega, no filtra

Cada círculo es un `<a>` a una **URL propia**:

```
/product-category/maquillaje/base/
/product-category/maquillaje/cejas/
/product-category/maquillaje/contorno/
/product-category/maquillaje/corrector/
/product-category/maquillaje/delineador/
/product-category/maquillaje/iluminador/
/product-category/maquillaje/labios/
/product-category/maquillaje/pestanas/
/product-category/maquillaje/pestanina/
```

Patrón: `/product-category/<categoria>/<subcategoria>/`.
**Recarga a una página nueva** — no es un filtro AJAX sobre la misma vista.
Esto importa para CARLIN: implica rutas reales tipo `/catalogo/[categoria]/[subcategoria]`,
que es exactamente la estructura que el proyecto ya tiene.

### 3.3 Grid de productos

| Propiedad | Valor |
|---|---|
| Columnas en escritorio | **4** (verificado midiendo posiciones) |
| Ancho de tarjeta | **279 px** |
| Productos por página | **16** |
| Fondo de tarjeta | `#FFFFFF` |
| `border-radius` de tarjeta | **15 px** |
| Borde de tarjeta | `0.8px solid #FDECF5` |
| Breakpoint del tema | `min-width: 768px` → 4 columnas |

**Contenido de cada tarjeta (de arriba abajo):** imagen → banda rosada con el nombre de la línea
sobre la imagen → título del producto en mayúsculas → precio → botón "AÑADIR AL CARRITO".

**Botón "AÑADIR AL CARRITO":**

| Propiedad | Valor |
|---|---|
| Fondo | `#F0A0C6` |
| Texto | `#FFFFFF` |
| `border-radius` | **12 px** |
| Tamaño / peso | 13 px / **700** |
| `letter-spacing` | **1 px** |

### 3.4 Paginación — numerada, no scroll infinito

- Texto de conteo: `Mostrando 1–16 de 219 resultados`
- Controles: `1 2 3 4 … 12 13 14 →` (14 páginas)
- URLs: `/product-category/maquillaje/page/2/`, `/page/3/`, …
- **No hay scroll infinito ni botón "cargar más".**

### 3.5 Ordenamiento

`<select class="orderby">` a la derecha del conteo, con 5 opciones:

1. Orden predeterminado
2. Ordenar por popularidad
3. Ordenar por los últimos
4. Ordenar por precio: bajo a alto
5. Ordenar por precio: alto a bajo

### 3.6 Filtros — sidebar izquierda

Ancho de sidebar a la izquierda del grid, con dos widgets:

**a) "Categorías"** — árbol jerárquico expandible con chevrones `>`.
Lista las categorías raíz (ACCESORIOS, CABELLO, CORPORAL, FACIAL, MAQUILLAJE, Nuevo, PESTAÑA,
PESTAÑINAS, SKINCARE, VARIOS) y al abrir MAQUILLAJE despliega sus hijas (BASE, CEJAS, CONTORNO,
CORRECTOR, DELINEADOR, ILUMINADOR, LABIOS, PESTAÑAS, PESTAÑINA, POLVO, Primer, RUBOR, SOMBRAS).

**b) "Filtrar por precio"** — slider de rango con dos manijas, botón **FILTRAR** y etiqueta
de rango en vivo (`Precio: $0 — $52.000`).

**No hay filtro por marca.** Los únicos filtros son categoría y precio.

---

## 4. Nav bar de Purpure

### 4.1 Estructura de dos filas — confirmada

**Fila 0 — marquee** (45 px, `#FF80B3`) → ver sección 2. **No es parte del sticky.**

**Fila 1 — utilitaria** (fondo `#FFFFFF`, ~102 px):
- Logo a la izquierda
- Bloque de búsqueda centrado: `<select>` "Todas las Categorías" + input "Buscar por productos" + botón rosado "Buscar"
- Iconos a la derecha: cuenta, wishlist (con badge de conteo), carrito (con badge de conteo)

**Fila 2 — categorías** (`.t4s-section-header__bot`, fondo **`#FF80B3`**, **50 px**):
`INICIO · PURPURE · CUIDADO FACIAL · MAQUILLAJE · BROCHAS · CORPORAL · CAPILAR ·
HAZTE MAYORISTA · COMBOS Y PROMOS`

- Links: `#FFFFFF`, **14 px**, peso **400**, `Lato`, mayúsculas.
- "HAZTE MAYORISTA" lleva un **badge azul-lila "VER CATALOGO"** flotando sobre el link.

### 4.2 Comportamiento sticky — no encoge

| Propiedad | Valor |
|---|---|
| Técnica | **`position: sticky; top: 0`** sobre la sección completa del header |
| `z-index` | **460** |
| Alto pegado | **152 px** (fila 1 de 102 px + fila 2 de 50 px) |
| Umbral | Se pega al pasar el marquee, es decir a partir de **~45 px de scroll** |

**Comportamiento exacto:** el marquee (45 px) **se va con el scroll y no vuelve**. Las dos filas del
nav quedan fijas arriba **a altura completa**. No hay encogimiento, ni cambio de color, ni ocultar/
mostrar según dirección del scroll. El logo **mantiene su tamaño** (verificado: 200×100 antes y
después de hacer scroll).

### 4.3 Tamaño del logo — dato clave para CARLIN

| Propiedad | Valor |
|---|---|
| Medida renderizada | **200 × 100 px** |
| Archivo fuente | 200 × 89 px |
| Alto de la fila 1 | ~102 px |
| **Proporción logo / alto de fila** | **≈ 98 %** |

**El logo ocupa prácticamente toda la altura de su fila, sin margen visible arriba ni abajo.**
Esta es la referencia concreta para el pedido de "logo notablemente más grande" en CARLIN:
el logo debe dimensionarse contra la altura de la fila, no como un elemento pequeño centrado.

### 4.4 "Todas las Categorías" — ⚠️ no es un mega-menú

**Es un `<select>` nativo de 207 × 40 px dentro del `<form>` de búsqueda.** Su función es
**acotar la búsqueda** a una categoría, no navegar. Opciones:

```
Todas las Categorías, Accesorios, Accesorios Purpure, Brochas Purpure, Cuidado Capilar,
Cuidado Corporal Purpure, Cuidado capilar Purpure, Cuidado corporal, Cuidado facial,
Cuidado facial Purpure, Maquillaje, Maquillaje Purpure
```

### 4.5 Dónde están los desplegables de categorías

En la **fila 2**, no en el select. Los `<li>` llevan `t4s-type__drop … has--children`
(tipo `drop`, **no** `mega`).

Al pasar el mouse sobre **MAQUILLAJE** se abre un **flyout angosto de una sola columna**
(~275 px de ancho) alineado al link, con ítems que a su vez tienen chevron `⌄` para un
tercer nivel:

```
ROSTRO  ⌄
LABIOS  ⌄
OJOS    ⌄
ACCESORIOS MAQUILLAJE ⌄
```

**No muestra todas las subcategorías a la vez** — no es un mega-menú de ancho completo.

---

## 5. ⚠️ Discrepancias con el brief

Dos supuestos del encargo no coinciden con los sitios reales. **Resolver con el cliente antes de implementar.**

### 5.1 "Todas las Categorías" no es un menú de navegación

El brief lo describe como parte de la fila utilitaria y pregunta si es mega-menú o lista plana.
**No es ninguna de las dos:** es un `<select>` que acota la búsqueda (sección 4.4). La navegación
por categorías con desplegables vive en la fila 2 (sección 4.5).

**Impacto:** si CARLIN quiere un mega-menú con todas las subcategorías visibles a la vez, eso
**no existe en Purpure** y habría que diseñarlo desde cero. Purpure usa flyouts angostos de un nivel.

### 5.2 La barra superior de Bloomshell sí es un carrusel — confirmado

El brief anticipaba que la barra de Bloomshell es un carrusel con Next/Previous y no un marquee.
**Confirmado:** clases `pp-logos-carousel`, `logo-slider-next`, `logo-slider-prev`, con nodos
`bx-clone` (bxSlider). Se mantiene el criterio del brief: **para el marquee de CARLIN se copia
Purpure, no Bloomshell.**

Detalle adicional: esa franja `#FFBBEC` de Bloomshell contiene **dos cosas a la vez** — un título
fijo ("Página exclusiva para compras al Detal") y, debajo, el carrusel rotando mensajes de envío
("DESPACHO ENTRE 1 A 8 DÍAS HÁBILES…", "ENVÍOS A TODO COLOMBIA").

### 5.3 Las categorías principales de Bloomshell no son círculos

En la **home**, las 4 categorías raíz (ACCESORIOS, MAQUILLAJE, SKINCARE, CABELLO) son
**mosaicos rectangulares a sangre completa**, 4 por fila, con foto y el nombre en blanco abajo.

Los **círculos son solo para subcategorías**, y solo dentro de una página de categoría (sección 3.1).
Conviene confirmar con el cliente si quiere círculos en los dos niveles o replicar esta distinción.

---

## 6. Verificado vs. no verificado

**Verificado en vivo** (medición directa, escritorio 1536×816): todos los hex, tipografías, medidas
en px, tiempos de animación, URLs, comportamiento sticky y estructura de menús de las secciones 1–5.

**No verificado:**

- **Columnas del grid en móvil.** No se pudo forzar un viewport móvil real (el redimensionado de
  ventana no propagó al viewport de render). El dato de **4 columnas es de escritorio, medido**;
  el breakpoint `min-width: 768px` del tema está leído del CSS, pero **el número exacto de columnas
  por debajo de 768 px no se observó**. Confirmar en un dispositivo real antes de fijarlo en la fase de catálogo.
- **Filtros en móvil.** Existe un botón "FILTRAR" en el sidebar, pero **no se confirmó** si en móvil
  el sidebar pasa a modal, acordeón o drawer.
- **Estados hover** de botones y links (se documentó `#E58EC7` como candidato a hover del primario
  por dónde aparece, pero no se capturó el estado `:hover` en vivo).
