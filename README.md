# Market-IA

Market-IA convierte una fotografía de producto en una publicación comercial lista para revisar y compartir. La aplicación incluye una interfaz React + Vite + Tailwind en `/frontend`, un backend Express reutilizable en desarrollo local y como función serverless en `/api`, persistencia de productos e imágenes en Supabase y publicación en Facebook Page, Instagram y WhatsApp Cloud API.

## Flujo de uso

El vendedor arrastra una foto o la selecciona desde su dispositivo. El navegador la convierte temporalmente a un data URL y la envía al endpoint privado `/api/analyze`. El backend usa OpenAI Vision para devolver título, descripción, precio sugerido en MXN y hashtags con salida JSON estructurada. El usuario puede editar cualquier campo, guardar el producto y elegir Facebook, Instagram o WhatsApp.

Las claves privadas de OpenAI, Supabase y Meta únicamente se leen en el backend. El navegador nunca recibe `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` ni tokens de Meta.

## Configuración local

Instala Node.js 18 o superior y copia el archivo de variables:

```bash
cp .env.example .env
npm install
npm --prefix frontend install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173` y el backend en `http://localhost:3000`. Vite redirige automáticamente las llamadas `/api` al backend local.

## Supabase

Crea un proyecto de Supabase, abre el SQL Editor y ejecuta [`supabase/schema.sql`](./supabase/schema.sql). El script crea la tabla `products`, el bucket público `product-images` y políticas mínimas para que el servidor pueda guardar imágenes y registros. Completa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `.env`; la service role key solo debe existir en variables de servidor.

## Meta y OpenAI

Completa las variables de `.env.example` según la configuración de tu aplicación de Meta. Facebook usa `FB_PAGE_ID` y `FB_PAGE_ACCESS_TOKEN`; Instagram requiere un usuario Business/Creator conectado a una Page y usa `IG_USER_ID` e `IG_ACCESS_TOKEN`; WhatsApp usa `WA_PHONE_NUMBER_ID`, `WA_ACCESS_TOKEN` y un número destino en formato internacional sin `+` ni espacios.

Configura el webhook de Meta hacia `https://TU-DOMINIO.vercel.app/webhook`, con el mismo `VERIFY_TOKEN`. El servidor mantiene la verificación `GET /webhook` y responde `EVENT_RECEIVED` a los eventos `POST /webhook`.

## Endpoints principales

| Método | Ruta | Función |
| --- | --- | --- |
| `POST` | `/api/analyze` | Analiza una foto con OpenAI Vision y devuelve la ficha comercial. |
| `GET` | `/api/products` | Consulta los ocho productos recientes desde Supabase. |
| `POST` | `/api/products` | Sube la imagen al bucket e inserta el producto en Supabase. |
| `POST` | `/api/facebook/publish` | Publica una foto o texto en una Facebook Page mediante Graph API v22. |
| `POST` | `/api/instagram/publish` | Crea y publica un contenedor de imagen en Instagram Graph API v22. |
| `POST` | `/api/whatsapp/send` | Envía la imagen con caption, o texto si no hay imagen, por WhatsApp Cloud API. |
| `GET/POST` | `/webhook` | Verifica y recibe eventos de Meta. |

## Despliegue en Vercel

Importa el repositorio en Vercel usando la raíz del proyecto. La configuración [`vercel.json`](./vercel.json) ejecuta `npm --prefix frontend run build`, sirve `frontend/dist` y convierte `api/index.js` en la función que maneja `/api/*`. Añade en Vercel todas las variables de `.env.example` excepto las que empiecen por `VITE_` si no necesitas un número predeterminado en la interfaz. Si quieres precargar el número de WhatsApp, añade `VITE_WHATSAPP_TO` antes del build.

Después de desplegar, prueba `https://TU-DOMINIO.vercel.app/api/health` y configura el webhook con el dominio final. Los tokens de Meta deben tener los permisos correspondientes para publicar en la Page, administrar contenido de Instagram y enviar mensajes de WhatsApp.
