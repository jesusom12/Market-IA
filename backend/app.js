import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import OpenAI from "openai";

const app = express();
const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || "v22.0";
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "mercado_ia_123";
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-images";

app.use(cors({ origin: true }));
app.use(express.json({ limit: "16mb" }));

function jsonError(res, status, message, details) {
  return res.status(status).json({ error: message, ...(details ? { details } : {}) });
}

function cleanHashtags(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((tag) => String(tag).trim().replace(/\s+/g, ""))
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .slice(0, 10);
}

function normalizeProduct(value = {}) {
  const price = Number(value.price_mxn);
  return {
    title: String(value.title || "Producto nuevo").trim().slice(0, 140),
    description: String(value.description || "").trim().slice(0, 4000),
    price_mxn: Number.isFinite(price) ? Math.max(0, Math.round(price)) : 0,
    hashtags: cleanHashtags(value.hashtags),
    image_url: value.image_url ? String(value.image_url) : null,
    storage_path: value.storage_path ? String(value.storage_path) : null,
  };
}

function productCaption(product) {
  const normalized = normalizeProduct(product);
  return `${normalized.title}\n\n${normalized.description}\n\nPrecio: $${normalized.price_mxn.toLocaleString("es-MX")} MXN\n\n${normalized.hashtags.join(" ")}`.trim();
}

function requireSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
  }
  return { url: url.replace(/\/$/, ""), key };
}

function supabaseHeaders(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

async function uploadDataUrl(dataUrl) {
  const { url, key } = requireSupabase();
  const match = String(dataUrl || "").match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,(.+)$/s);
  if (!match) throw new Error("La imagen debe ser un data URL de imagen válido.");

  const mimeType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  const extension = mimeType.split("/")[1].replace("jpeg", "jpg");
  const storagePath = `products/${crypto.randomUUID()}.${extension}`;
  const bytes = Buffer.from(match[2], "base64");

  const response = await fetch(`${url}/storage/v1/object/${SUPABASE_BUCKET}/${storagePath}`, {
    method: "POST",
    headers: supabaseHeaders(key, {
      "Content-Type": mimeType,
      "x-upsert": "false",
      "cache-control": "3600",
    }),
    body: bytes,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase Storage rechazó la imagen: ${errorBody}`);
  }

  return {
    storage_path: storagePath,
    image_url: `${url}/storage/v1/object/public/${SUPABASE_BUCKET}/${storagePath}`,
  };
}

async function insertProduct(product) {
  const { url, key } = requireSupabase();
  const response = await fetch(`${url}/rest/v1/products`, {
    method: "POST",
    headers: supabaseHeaders(key, {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify({
      title: product.title,
      description: product.description,
      price_mxn: product.price_mxn,
      hashtags: product.hashtags,
      image_url: product.image_url,
      storage_path: product.storage_path,
      status: "draft",
    }),
  });

  const responseBody = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase Database rechazó el producto: ${responseBody}`);
  }

  const parsed = responseBody ? JSON.parse(responseBody) : [];
  return Array.isArray(parsed) ? parsed[0] : parsed;
}

async function listProducts() {
  const { url, key } = requireSupabase();
  const response = await fetch(`${url}/rest/v1/products?select=*&order=created_at.desc&limit=8`, {
    headers: supabaseHeaders(key),
  });
  const responseBody = await response.text();
  if (!response.ok) throw new Error(`No se pudieron consultar productos: ${responseBody}`);
  return responseBody ? JSON.parse(responseBody) : [];
}

function graphHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function getMetaToken() {
  return process.env.META_ACCESS_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN || process.env.WA_ACCESS_TOKEN;
}

async function graphPost(path, body, token) {
  const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${path}`, {
    method: "POST",
    headers: graphHeaders(token),
    body: JSON.stringify(body),
  });
  const responseBody = await response.text();
  let parsed;
  try {
    parsed = responseBody ? JSON.parse(responseBody) : {};
  } catch {
    parsed = { raw: responseBody };
  }
  if (!response.ok) {
    const message = parsed?.error?.message || responseBody || "Meta Graph API error";
    const error = new Error(message);
    error.meta = parsed;
    throw error;
  }
  return parsed;
}

const listingSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    price_mxn: { type: "number" },
    hashtags: { type: "array", items: { type: "string" } },
  },
  required: ["title", "description", "price_mxn", "hashtags"],
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "market-ia", graphApiVersion: GRAPH_API_VERSION });
});

app.post("/api/analyze", async (req, res) => {
  const image = req.body?.image;
  if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
    return jsonError(res, 400, "Envía una imagen como data URL.");
  }
  if (!process.env.OPENAI_API_KEY) {
    return jsonError(res, 503, "Falta configurar OPENAI_API_KEY en el servidor.");
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "Eres un copywriter experto en comercio electrónico mexicano. Analiza la foto y crea una ficha comercial clara, atractiva y honesta. No inventes marca, materiales, medidas o características que no sean visibles. El precio debe ser una sugerencia razonable en pesos mexicanos para el artículo observado. Usa español de México.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Genera título, descripción vendedora, precio sugerido en MXN y hasta 8 hashtags. La descripción debe destacar beneficios visibles, resolver una necesidad y cerrar con una invitación a comprar. Los hashtags deben iniciar con #.",
            },
            { type: "input_image", image_url: image, detail: "high" },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "product_listing",
          strict: true,
          schema: listingSchema,
        },
      },
    });

    if (!response.output_text) throw new Error("La IA no devolvió contenido.");
    const product = normalizeProduct(JSON.parse(response.output_text));
    return res.json({ product });
  } catch (error) {
    console.error("Analyze error:", error);
    return jsonError(res, 500, "No se pudo generar la publicación con IA.", error.message);
  }
});

app.get("/api/products", async (_req, res) => {
  try {
    return res.json({ products: await listProducts() });
  } catch (error) {
    return jsonError(res, 503, "No se pudieron cargar los productos.", error.message);
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const product = normalizeProduct(req.body);
    if (!product.title || !product.description) return jsonError(res, 400, "Título y descripción son obligatorios.");

    let media = { image_url: product.image_url, storage_path: product.storage_path };
    if (!media.image_url && req.body?.image_data_url) {
      media = await uploadDataUrl(req.body.image_data_url);
    }
    if (!media.image_url) return jsonError(res, 400, "La imagen del producto es obligatoria.");

    const saved = await insertProduct({ ...product, ...media });
    return res.status(201).json({ product: saved });
  } catch (error) {
    console.error("Product save error:", error);
    return jsonError(res, 503, "No se pudo guardar el producto en Supabase.", error.message);
  }
});

app.post("/api/facebook/publish", async (req, res) => {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  const product = normalizeProduct(req.body);
  if (!pageId || !token) return jsonError(res, 503, "Faltan FB_PAGE_ID y FB_PAGE_ACCESS_TOKEN.");

  try {
    const result = product.image_url
      ? await graphPost(`${pageId}/photos`, { url: product.image_url, caption: productCaption(product), published: true }, token)
      : await graphPost(`${pageId}/feed`, { message: productCaption(product) }, token);
    return res.json({ ok: true, platform: "facebook", result });
  } catch (error) {
    console.error("Facebook publish error:", error);
    return jsonError(res, 502, "Facebook rechazó la publicación.", error.meta || error.message);
  }
});

app.post("/api/instagram/publish", async (req, res) => {
  const instagramUserId = process.env.IG_USER_ID || process.env.INSTAGRAM_USER_ID;
  const token = process.env.IG_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  const product = normalizeProduct(req.body);
  if (!instagramUserId || !token) return jsonError(res, 503, "Faltan IG_USER_ID y un token de Instagram/Meta.");
  if (!product.image_url) return jsonError(res, 400, "Instagram requiere una URL pública para la imagen.");

  try {
    const container = await graphPost(`${instagramUserId}/media`, {
      image_url: product.image_url,
      caption: productCaption(product),
    }, token);
    const published = await graphPost(`${instagramUserId}/media_publish`, { creation_id: container.id }, token);
    return res.json({ ok: true, platform: "instagram", result: published, container });
  } catch (error) {
    console.error("Instagram publish error:", error);
    return jsonError(res, 502, "Instagram rechazó la publicación.", error.meta || error.message);
  }
});

app.post("/api/whatsapp/send", async (req, res) => {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const token = process.env.WA_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  const to = req.body?.to || process.env.WHATSAPP_TO;
  const product = normalizeProduct(req.body);
  const text = req.body?.text || productCaption(product);
  if (!phoneNumberId || !token) return jsonError(res, 503, "Faltan WA_PHONE_NUMBER_ID y WA_ACCESS_TOKEN.");
  if (!to) return jsonError(res, 400, "Indica el número de WhatsApp destino en formato internacional.");

  try {
    const message = product.image_url
      ? {
          messaging_product: "whatsapp",
          to,
          type: "image",
          image: { link: product.image_url, caption: text },
        }
      : { messaging_product: "whatsapp", to, type: "text", text: { body: text } };
    const result = await graphPost(`${phoneNumberId}/messages`, message, token);
    return res.json({ ok: true, platform: "whatsapp", result });
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return jsonError(res, 502, "WhatsApp rechazó el envío.", error.meta || error.message);
  }
});

app.post("/api/instagram/reply", async (req, res) => {
  const token = process.env.IG_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
  const commentId = req.body?.comment_id;
  const message = req.body?.message;
  if (!token || !commentId || !message) return jsonError(res, 400, "Faltan token, comment_id o message.");
  try {
    const result = await graphPost(`${commentId}/replies`, { message }, token);
    return res.json({ ok: true, result });
  } catch (error) {
    return jsonError(res, 502, "Instagram rechazó la respuesta.", error.meta || error.message);
  }
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

app.post("/webhook", (req, res) => {
  console.log("Webhook:", JSON.stringify(req.body, null, 2));
  return res.status(200).send("EVENT_RECEIVED");
});

export default app;
