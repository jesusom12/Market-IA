# INSTRUCCIONES PARA MANUS - PROYECTO Mercado-IA

Eres Manus IA. Vas a continuar el proyecto Mercado-IA del usuario jesusom12/Mercado-IA.

CONTEXTO:
El usuario quiere: "Es el momento de vender con solo subir una foto de tu producto"
Ya existe backend en backend/index.js con conexion a Facebook, Instagram y WhatsApp Business API (webhooks verificados y endpoints /api/whatsapp/send, /api/instagram/reply)

TU TAREA:
1. Crea /frontend con React + Vite + Tailwind. Una sola pagina:
   - Zona para subir foto (drag & drop)
   - Al subir foto, usa IA vision para generar: titulo, descripcion vendedora, precio sugerido en MXN, hashtags
   - Preview del anuncio
   - 3 botones: Publicar en Facebook Page, Publicar en Instagram, Enviar por WhatsApp

2. Mejora /backend:
   - Conecta Supabase para guardar productos
   - Endpoints para publicar en FB/IG usando Graph API v22

3. Deja .env.example con las variables que necesitas.

Despliega en Vercel.

Empieza ya.
