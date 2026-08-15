async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.details?.error?.message || payload.details || payload.error;
    throw new Error(detail || "La solicitud no pudo completarse.");
  }
  return payload;
}

export async function analyzeProductImage(imageDataUrl) {
  const payload = await request("/api/analyze", {
    method: "POST",
    body: JSON.stringify({ image: imageDataUrl }),
  });
  return payload.product;
}

export async function saveProduct(product) {
  const payload = await request("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
  return payload.product;
}

export async function getProducts() {
  const payload = await request("/api/products");
  return payload.products || [];
}

export async function publishToFacebook(product) {
  return request("/api/facebook/publish", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function publishToInstagram(product) {
  return request("/api/instagram/publish", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function publishToWhatsApp(product) {
  return request("/api/whatsapp/send", {
    method: "POST",
    body: JSON.stringify(product),
  });
}
