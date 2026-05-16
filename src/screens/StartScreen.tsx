interface Props {
  onStart: () => void;
}

export default function StartScreen({ onStart }: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] animate-fade-in">
      {/* Decorative ring */}
      <div className="relative mb-12">
        <div className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
              />
            </svg>
          </div>
        </div>
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse-ring" />
      </div>

      <h1 className="text-5xl font-light tracking-widest uppercase text-white/90 mb-3 animate-slide-up">
        Gesture
      </h1>
      <p className="text-white/30 text-sm tracking-[0.3em] uppercase mb-16 animate-slide-up">
        Camera Booth
      </p>

      <button
        onClick={onStart}
        className="animate-slide-up px-10 py-3.5 rounded-full border border-white/20 text-white/80 text-sm tracking-widest uppercase hover:bg-white/10 hover:border-white/40 transition-all duration-300"
      >
        Start
      </button>
    </div>
  );
}
