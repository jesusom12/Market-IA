import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, ChevronRight, CircleHelp, Leaf, LoaderCircle, Package, RefreshCw, ShieldCheck, Sparkles, Store, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import Dropzone from "./components/Dropzone";
import ProductPreview from "./components/ProductPreview";
import { analyzeProductImage, getProducts, publishToFacebook, publishToInstagram, publishToWhatsApp, saveProduct } from "./lib/api";

const initialProduct = { title: "", description: "", price_mxn: 0, hashtags: [] };

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function platformLabel(platform) {
  return { facebook: "Facebook", instagram: "Instagram", whatsapp: "WhatsApp" }[platform] || platform;
}

export default function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [product, setProduct] = useState(null);
  const [savedProduct, setSavedProduct] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [phone, setPhone] = useState(import.meta.env.VITE_WHATSAPP_TO || "");
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);

  const isEditing = Boolean(product);
  const productWithImage = useMemo(() => ({ ...product, image_url: savedProduct?.image_url || null }), [product, savedProduct]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    refreshHistory();
  }, []);

  async function refreshHistory() {
    setLoadingHistory(true);
    try {
      setRecentProducts(await getProducts());
    } catch {
      // La vista principal sigue funcionando aunque Supabase aún no esté configurado.
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleFile(candidate, errorMessage) {
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }
    if (!candidate) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const localPreview = URL.createObjectURL(candidate);
    setFile(candidate);
    setPreviewUrl(localPreview);
    setSavedProduct(null);
    setProduct(null);
    setBusy(true);

    try {
      const dataUrl = await readFileAsDataUrl(candidate);
      setImageDataUrl(dataUrl);
      const generated = await analyzeProductImage(dataUrl);
      setProduct(generated);
      toast.success("Tu anuncio está listo para revisar.");
    } catch (error) {
      toast.error(error.message || "No se pudo analizar la imagen.");
    } finally {
      setBusy(false);
    }
  }

  function updateProduct(field, value) {
    setSavedProduct(null);
    setProduct((current) => ({ ...current, [field]: value }));
  }

  async function ensureSaved() {
    if (savedProduct?.id && savedProduct?.image_url) return savedProduct;
    if (!product || !imageDataUrl) throw new Error("Primero sube una foto y revisa el anuncio.");

    const saved = await saveProduct({
      ...product,
      image_data_url: imageDataUrl,
    });
    setSavedProduct(saved);
    setRecentProducts((current) => [saved, ...current.filter((item) => item.id !== saved.id)].slice(0, 8));
    return saved;
  }

  async function handlePublish(platform) {
    setPublishing(platform);
    try {
      const saved = await ensureSaved();
      const payload = { ...saved, ...product, image_url: saved.image_url, to: phone };
      if (platform === "facebook") await publishToFacebook(payload);
      if (platform === "instagram") await publishToInstagram(payload);
      if (platform === "whatsapp") await publishToWhatsApp(payload);
      toast.success(`Publicado correctamente en ${platformLabel(platform)}.`);
      setSavedProduct((current) => current ? { ...current, status: "published" } : current);
    } catch (error) {
      toast.error(error.message || `No se pudo publicar en ${platformLabel(platform)}.`);
    } finally {
      setPublishing("");
    }
  }

  function resetComposer() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setImageDataUrl("");
    setProduct(null);
    setSavedProduct(null);
  }

  return (
    <div className="min-h-screen overflow-x-hidden text-ink">
      <header className="relative z-10 border-b border-ink/10 bg-cream/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <a href="/" className="flex items-center gap-3" aria-label="Market-IA inicio">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-moss text-leaf shadow-card"><Leaf className="h-5 w-5 fill-current" /></div>
            <div><p className="font-display text-xl font-semibold tracking-tight">Market-IA</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-moss/65">vender se siente fácil</p></div>
          </a>
          <div className="hidden items-center gap-6 text-sm font-medium text-ink/55 sm:flex"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-moss" /> Tus datos, bajo control</span><a href="#como-funciona" className="transition hover:text-moss">Cómo funciona <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></a></div>
          <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-xs font-semibold text-moss sm:hidden"><ShieldCheck className="h-3.5 w-3.5" /> Seguro</div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:px-10 lg:pt-20">
          <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-moss/15 bg-white/55 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-moss"><Sparkles className="h-3.5 w-3.5 text-coral" /> Tu asistente de ventas</div>
              <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-ink sm:text-6xl lg:text-7xl">Vende con una foto.<br /><span className="text-moss">Crece con intención.</span></h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-ink/60 sm:text-lg">Market-IA convierte la foto de tu producto en una publicación completa, atractiva y lista para llegar a tus clientes.</p>
              <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-ink/50"><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 rounded-full bg-leaf/45 p-0.5 text-moss" /> Título que conecta</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 rounded-full bg-leaf/45 p-0.5 text-moss" /> Precio en MXN</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 rounded-full bg-leaf/45 p-0.5 text-moss" /> Publica donde quieras</span></div>
            </div>
            <div className="relative hidden min-h-[12rem] lg:block"><div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-leaf/45 blur-2xl" /><div className="absolute bottom-2 right-16 h-20 w-52 rotate-[-8deg] rounded-[2rem] border border-white/80 bg-white/50 shadow-card backdrop-blur-xl" /><div className="absolute right-10 top-8 w-56 rotate-[5deg] rounded-[2rem] border border-white/90 bg-sand/80 p-5 shadow-soft"><div className="mb-5 flex items-center justify-between"><div className="h-8 w-8 rounded-xl bg-coral/80" /><div className="h-2 w-16 rounded-full bg-ink/10" /></div><div className="h-3 w-4/5 rounded-full bg-ink/15" /><div className="mt-2 h-2 w-3/5 rounded-full bg-ink/10" /><div className="mt-6 flex items-end justify-between"><div className="h-5 w-20 rounded-full bg-moss/70" /><div className="h-3 w-12 rounded-full bg-coral/50" /></div></div></div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-7 px-5 pb-20 sm:px-8 lg:grid-cols-[0.93fr_1.07fr] lg:px-10">
          <div className="min-w-0">
            <div className="mb-4 flex items-end justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-coral">Paso 01</p><h2 className="mt-1 font-display text-2xl font-semibold">Sube tu producto</h2></div>{isEditing && <button type="button" onClick={resetComposer} className="text-xs font-semibold text-moss transition hover:text-coral">Empezar de nuevo</button>}</div>
            <Dropzone file={file} previewUrl={previewUrl} busy={busy} onFile={handleFile} />
            <div className="mt-5 rounded-3xl border border-ink/10 bg-white/55 p-5 shadow-card sm:p-6"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sand text-moss"><CircleHelp className="h-4 w-4" /></div><div><p className="text-sm font-semibold">Una buena foto hace la diferencia</p><p className="mt-1 text-xs leading-5 text-ink/55">Busca buena luz, muestra el producto completo y evita fondos demasiado cargados. La IA será más precisa.</p></div></div></div>
          </div>

          <div className="min-w-0"><div className="mb-4 flex items-end justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-coral">Paso 02</p><h2 className="mt-1 font-display text-2xl font-semibold">Revisa y comparte</h2></div>{product && <div className="inline-flex items-center gap-1.5 rounded-full bg-leaf/30 px-3 py-1.5 text-xs font-bold text-moss"><WandSparkles className="h-3.5 w-3.5" /> IA lista</div>}</div>
            <ProductPreview product={product} imageUrl={previewUrl} phone={phone} onChange={() => document.querySelector("textarea")?.focus()} onPublish={handlePublish} publishing={Boolean(publishing)} />
            {product && <div className="mt-5 rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-card sm:p-6"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-bold">Ajusta el texto a tu estilo</p><p className="mt-1 text-xs text-ink/45">La IA propone; tú decides.</p></div><Package className="h-5 w-5 text-moss/50" /></div><div className="grid gap-4"><label className="grid gap-1.5 text-xs font-bold text-ink/55">Título<input value={product.title} onChange={(event) => updateProduct("title", event.target.value)} className="rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm font-semibold text-ink outline-none transition focus:border-moss/40" /></label><label className="grid gap-1.5 text-xs font-bold text-ink/55">Descripción<textarea value={product.description} onChange={(event) => updateProduct("description", event.target.value)} rows={4} className="resize-y rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm leading-6 text-ink outline-none transition focus:border-moss/40" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-bold text-ink/55">Precio sugerido (MXN)<input type="number" min="0" value={product.price_mxn} onChange={(event) => updateProduct("price_mxn", Number(event.target.value))} className="rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm font-semibold text-ink outline-none transition focus:border-moss/40" /></label><label className="grid gap-1.5 text-xs font-bold text-ink/55">WhatsApp destino<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="5215512345678" className="rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm font-semibold text-ink outline-none transition focus:border-moss/40" /></label></div><label className="grid gap-1.5 text-xs font-bold text-ink/55">Hashtags (separados por coma)<input value={(product.hashtags || []).join(", ")} onChange={(event) => updateProduct("hashtags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} className="rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink outline-none transition focus:border-moss/40" /></label></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-ink/45">Se guardará en Supabase al publicar.</p><button type="button" className="inline-flex items-center gap-2 rounded-full bg-moss px-4 py-2.5 text-xs font-bold text-white transition hover:bg-ink active:scale-[0.97]" onClick={async () => { try { await ensureSaved(); toast.success("Producto guardado en tu catálogo."); } catch (error) { toast.error(error.message); } }}><Store className="h-3.5 w-3.5" /> Guardar producto</button></div></div>}
          </div>
        </section>

        <section id="como-funciona" className="border-y border-ink/10 bg-white/35"><div className="mx-auto grid max-w-7xl gap-5 px-5 py-12 sm:grid-cols-3 sm:px-8 lg:px-10"><div className="rounded-3xl bg-sand/55 p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">01 · Captura</p><p className="mt-3 font-display text-xl font-semibold">Una foto real, sin complicaciones.</p><p className="mt-2 text-sm leading-6 text-ink/55">Arrastra la imagen de tu teléfono o selecciónala desde tu computadora.</p></div><div className="rounded-3xl bg-leaf/25 p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-moss">02 · Potencia</p><p className="mt-3 font-display text-xl font-semibold">La IA encuentra las palabras.</p><p className="mt-2 text-sm leading-6 text-ink/55">Obtén una historia breve, un precio orientativo y hashtags que ayudan a descubrirte.</p></div><div className="rounded-3xl bg-coral/10 p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-coral">03 · Comparte</p><p className="mt-3 font-display text-xl font-semibold">Tu publicación sale al mundo.</p><p className="mt-2 text-sm leading-6 text-ink/55">Edita lo que quieras y publícala en Facebook, Instagram o envíala por WhatsApp.</p></div></div></section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-coral">Tu catálogo</p><h2 className="mt-1 font-display text-3xl font-semibold">Productos recientes</h2></div><button type="button" onClick={refreshHistory} className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-4 py-2.5 text-xs font-bold text-moss transition hover:border-moss/30"><RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? "animate-spin" : ""}`} /> Actualizar</button></div>{recentProducts.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{recentProducts.map((item) => <article key={item.id} className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-card"><div className="aspect-[4/3] bg-cream">{item.image_url && <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />}</div><div className="p-4"><p className="truncate font-display text-lg font-semibold">{item.title}</p><div className="mt-2 flex items-center justify-between"><span className="text-sm font-bold text-coral">{formatMoney(item.price_mxn)}</span><span className="rounded-full bg-leaf/30 px-2.5 py-1 text-[10px] font-bold uppercase text-moss">{item.status || "draft"}</span></div></div></article>)}</div> : <div className="mt-7 rounded-3xl border border-dashed border-ink/15 bg-white/45 px-6 py-10 text-center"><Package className="mx-auto h-7 w-7 text-moss/45" /><p className="mt-3 text-sm font-semibold text-ink/60">Aún no tienes productos guardados.</p><p className="mt-1 text-xs text-ink/40">Tu primer anuncio aparecerá aquí cuando lo guardes.</p></div>}</section>
      </main>

      <footer className="border-t border-ink/10 bg-ink px-5 py-8 text-white/60 sm:px-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs sm:flex-row"><p>© {new Date().getFullYear()} Market-IA · Hecho para quienes venden con corazón.</p><p className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-leaf" /> Tu contenido siempre necesita tu aprobación.</p></div></footer>
    </div>
  );
}
