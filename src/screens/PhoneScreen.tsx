import { useState } from "react";

interface Props {
  onSubmit: (phoneNumber: string) => void;
}

export default function PhoneScreen({ onSubmit }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 10) onSubmit(digits);
  }

  function formatDisplay(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setValue(digits);
  }

  const isValid = value.replace(/\D/g, "").length >= 10;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] animate-fade-in px-8">
      <h2 className="text-3xl font-light tracking-widest uppercase text-white/90 mb-3 animate-slide-up">
        Your Number
      </h2>
      <p className="text-white/30 text-sm tracking-wide mb-12 animate-slide-up">
        We'll text your photo here
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col items-center gap-6 animate-slide-up">
        <input
          type="tel"
          inputMode="numeric"
          value={formatDisplay(value)}
          onChange={handleChange}
          placeholder="(206) 555-0100"
          autoFocus
          className="w-full text-center text-2xl font-light tracking-widest text-white/90 bg-transparent border-b border-white/20 pb-3 outline-none placeholder:text-white/15 focus:border-white/50 transition-colors duration-200"
        />

        <p className="text-white/25 text-xs tracking-wide text-center leading-relaxed max-w-xs">
          Your photo will be texted to this number and deleted immediately after the session.
        </p>

        <button
          type="submit"
          disabled={!isValid}
          className="mt-4 px-10 py-3.5 rounded-full border border-white/20 text-white/80 text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-white/10 hover:enabled:border-white/40"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
