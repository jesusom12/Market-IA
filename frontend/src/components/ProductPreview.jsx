import { Facebook, Instagram, MessageCircle, PencilLine, Send, Sparkles } from "lucide-react";

function money(value) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export default function ProductPreview({ product, imageUrl, phone, onChange, onPublish, publishing }) {
  if (!product) {
    return (
      <div className="flex h-full min-h-[32rem] flex-col items-center justify-center rounded-[2rem] border border-ink/10 bg-white/55 p-8 text-center shadow-card">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sand text-moss">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="font-display text-2xl font-semibold text-ink">Tu anuncio aparecerá aquí</h2>
        <p className="mt-3 max-w-xs text-sm leading-6 text-ink/55">Sube una foto y deja que Market-IA convierta lo que vendes en una publicación que se antoja.</p>
      </div>
    );
  }

  return (
    <div className="animate-float-in overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-coral">Borrador inteligente</p>
          <p className="mt-1 text-xs text-ink/45">Listo para revisar antes de publicar</p>
        </div>
        <button type="button" onClick={onChange} className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-2 text-xs font-semibold text-ink/65 transition hover:border-moss/30 hover:text-moss">
          <PencilLine className="h-3.5 w-3.5" /> Editar
        </button>
      </div>

      <div className="grid gap-5 p-5 sm:p-6">
        <div className="relative overflow-hidden rounded-3xl bg-cream">
          {imageUrl ? <img src={imageUrl} alt="Producto a publicar" className="aspect-[4/3] h-full w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center text-sm text-ink/40">Sin imagen</div>}
          <div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-bold text-moss shadow-card backdrop-blur">Sugerencia IA</div>
        </div>

        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink">{product.title}</h2>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="text-2xl font-bold text-coral">{money(product.price_mxn)}</p>
            <span className="rounded-full bg-leaf/35 px-3 py-1.5 text-xs font-semibold text-moss">Precio sugerido</span>
          </div>
          <p className="mt-5 whitespace-pre-line text-sm leading-7 text-ink/70">{product.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {(product.hashtags || []).map((tag) => <span key={tag} className="rounded-full bg-sand px-3 py-1.5 text-xs font-semibold text-moss">{tag}</span>)}
          </div>
        </div>
      </div>

      <div className="border-t border-ink/10 bg-cream/50 px-5 py-5 sm:px-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-ink/40">Publicar en</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1877f2] px-3 py-3 text-sm font-semibold text-white transition duration-150 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onPublish("facebook")}
            disabled={publishing}
          >
            <Facebook className="h-4 w-4 fill-current" /> Facebook
          </button>
          <button
            type="button"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#e1306c] via-[#c13584] to-[#833ab4] px-3 py-3 text-sm font-semibold text-white transition duration-150 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onPublish("instagram")}
            disabled={publishing}
          >
            <Instagram className="h-4 w-4" /> Instagram
          </button>
          <button
            type="button"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#159a67] px-3 py-3 text-sm font-semibold text-white transition duration-150 hover:-translate-y-0.5 hover:shadow-card active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onPublish("whatsapp")}
            disabled={publishing || !phone}
            title={!phone ? "Agrega un número de WhatsApp para activar el botón" : "Enviar por WhatsApp"}
          >
            <MessageCircle className="h-4 w-4 fill-current" /> WhatsApp
          </button>
        </div>
        {!phone && <p className="mt-3 text-xs text-coral">Agrega un número de WhatsApp arriba para activar el envío directo.</p>}
        {publishing && <p className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-moss"><Send className="h-3.5 w-3.5 animate-pulse" /> Publicando...</p>}
      </div>
    </div>
  );
}
