interface Props {
  onContinue: () => void;
}

export default function CostScreen({ onContinue }: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] animate-fade-in">
      <div className="glass rounded-2xl p-12 flex flex-col items-center gap-8 max-w-sm w-full mx-4">
        <p className="text-white/30 text-xs tracking-[0.3em] uppercase">
          Session Total
        </p>

        <div className="flex items-start gap-1">
          <span className="text-white/40 text-xl mt-2">$</span>
          <span className="text-white text-7xl font-light">2</span>
          <span className="text-white/40 text-xl mt-2">.00</span>
        </div>

        <p className="text-white/30 text-xs text-center">
          Digital download + printed photo strip
        </p>

        <button
          onClick={onContinue}
          className="w-full py-3.5 rounded-full bg-white text-black text-sm font-medium tracking-widest uppercase hover:bg-white/90 transition-all duration-200"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
