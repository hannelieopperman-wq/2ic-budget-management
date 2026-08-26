import { useRef, useState, type DragEvent } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

export function CsvDropzone({
  file,
  onFile,
  onClear,
}: {
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.name.toLowerCase().endsWith('.csv')) onFile(f);
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-blush bg-blush-soft/50 p-5 animate-scale-in">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-plum text-cream">
          <FileText size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-plum-ink">{file.name}</p>
          <p className="text-xs text-plum-soft">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button
          onClick={onClear}
          aria-label="Remove file"
          className="rounded-full p-2 text-plum-soft hover:bg-blush hover:text-plum"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-16 text-center transition
        ${dragOver ? 'border-rose bg-blush-soft/70' : 'border-blush bg-cream/60 hover:bg-blush-soft/40'}`}
    >
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-blush text-rose-deep">
        <UploadCloud size={26} />
      </div>
      <p className="font-serif text-lg text-plum-ink">Drop your bank CSV here</p>
      <p className="mt-1 text-sm text-plum-soft">or choose a file</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}
