import { useRef, useState } from "react";
import { Camera, ImagePlus, LoaderCircle, Sparkles, UploadCloud } from "lucide-react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024;

export default function Dropzone({ file, previewUrl, busy, onFile }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  function validateAndSend(candidate) {
    if (!candidate) return;
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      onFile(null, "Elige una imagen JPG, PNG, WEBP o GIF.");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      onFile(null, "La imagen debe pesar menos de 10 MB.");
      return;
    }
    onFile(candidate);
  }

  function onDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    validateAndSend(event.dataTransfer.files?.[0]);
  }

  return (
    <div
      className={`upload-grid relative overflow-hidden rounded-[2rem] border-2 border-dashed p-4 transition-all duration-200 sm:p-6 ${
        isDragging ? "border-coral bg-coral/10 shadow-soft" : "border-moss/25 bg-white/60 hover:border-moss/50"
      } ${busy ? "pointer-events-none opacity-80" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setIsDragging(false);
      }}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !busy) inputRef.current?.click();
      }}
      aria-label="Sube una foto de tu producto"
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        onChange={(event) => validateAndSend(event.target.files?.[0])}
      />

      {previewUrl ? (
        <div className="relative min-h-[23rem] overflow-hidden rounded-[1.5rem] bg-ink sm:min-h-[26rem]">
          <img src={previewUrl} alt={file?.name || "Vista previa del producto"} className="absolute inset-0 h-full w-full object-contain" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-ink/90 to-transparent px-5 pb-5 pt-12 text-white">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{file?.name}</p>
              <p className="mt-1 text-xs text-white/65">{(file?.size / 1024 / 1024).toFixed(2)} MB · Imagen lista</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/25"
              onClick={() => inputRef.current?.click()}
            >
              Cambiar foto
            </button>
          </div>
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/55 backdrop-blur-[2px]">
              <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-card">
                <LoaderCircle className="h-5 w-5 animate-spin text-coral" />
                La IA está creando tu anuncio...
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex min-h-[23rem] flex-col items-center justify-center rounded-[1.5rem] bg-white/70 px-6 py-12 text-center sm:min-h-[26rem]">
          <div className="relative mb-7">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-leaf/45 text-moss shadow-card">
              <Camera className="h-9 w-9" strokeWidth={1.6} />
            </div>
            <span className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-coral text-white shadow-card">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Tu producto. Una foto. Más ventas.</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink/60">Arrastra una imagen aquí o selecciónala. Market-IA detecta lo esencial y escribe una publicación lista para compartir.</p>
          <button
            type="button"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-semibold text-white shadow-card transition duration-150 hover:-translate-y-0.5 hover:bg-ink active:scale-[0.97]"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <UploadCloud className="h-4 w-4" />
            Elegir foto
          </button>
          <div className="mt-5 flex items-center gap-2 text-xs text-ink/45">
            <ImagePlus className="h-3.5 w-3.5" />
            JPG, PNG, WEBP o GIF · Máx. 10 MB
          </div>
        </div>
      )}
    </div>
  );
}
