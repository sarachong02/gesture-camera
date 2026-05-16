interface Props {
  imageUrl: string;
  onRetake: () => void;
  onSave: () => void;
}

export default function CaptureScreen({ imageUrl, onRetake, onSave }: Props) {
  function handleSave() {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `gesture-photo-${Date.now()}.jpg`;
    link.click();
    onSave();
  }

  return (
    <div className="w-full h-full relative bg-black animate-fade-in">
      {/* Full-screen captured image */}
      <img
        src={imageUrl}
        alt="Captured photo"
        className="w-full h-full object-cover"
      />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

      {/* Action bar */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={onRetake}
          className="glass-dark px-8 py-3 rounded-full text-white/70 text-sm tracking-widest uppercase hover:bg-white/10 transition-all duration-200"
        >
          Retake
        </button>

        <button
          onClick={handleSave}
          className="px-8 py-3 rounded-full bg-white text-black text-sm font-medium tracking-widest uppercase hover:bg-white/90 transition-all duration-200"
        >
          Save
        </button>
      </div>

      {/* Top label */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 glass-dark rounded-full px-5 py-2">
        <p className="text-white/40 text-xs tracking-widest uppercase">
          Photo captured
        </p>
      </div>
    </div>
  );
}
