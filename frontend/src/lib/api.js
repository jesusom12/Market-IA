const API_URL = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
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
  return payload.products;
}
