import { useState } from "react";

interface Props {
  onSubmit: (phoneNumber: string) => void;
}

function formatDisplay(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const PAD_KEYS = ["1","2","3","4","5","6","7","8","9","","0","del"] as const;

export default function PhoneScreen({ onSubmit }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit() {
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 10) onSubmit(digits);
  }

  function handleKeyPress(key: string) {
    if (key === "del") {
      setValue((v) => v.slice(0, -1));
    } else if (value.length < 10) {
      setValue((v) => v + key);
    }
  }

  const isValid = value.replace(/\D/g, "").length >= 10;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in px-6">
      <div className="flex flex-col items-center w-full max-w-sm gap-8">

        {/* Header */}
        <div className="text-center animate-slide-up">
          <h2 className="font-display text-4xl font-normal text-primary mb-2">
            Your Number
          </h2>
          <p className="text-primary/70 text-sm tracking-wide">
            We'll text your photo here
          </p>
        </div>

        {/* Phone number display */}
        <div className="w-full animate-slide-up">
          <div className="w-full text-center text-3xl font-light tracking-[0.15em] text-primary pb-4 border-b border-primary/20 min-h-[56px] flex items-end justify-center">
            {value.length > 0
              ? formatDisplay(value)
              : <span className="text-primary/20">(206) 555-0100</span>
            }
          </div>
        </div>

        {/* iOS-style numeric keypad */}
        <div className="w-full grid grid-cols-3 gap-3 animate-slide-up">
          {PAD_KEYS.map((key, i) => {
            if (key === "") return <div key={i} />;

            const isDel = key === "del";
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyPress(key)}
                className={[
                  "h-16 rounded-2xl flex items-center justify-center select-none",
                  "transition-all duration-75 active:scale-95",
                  isDel
                    ? "bg-white/10 border border-white/20 text-primary/70 active:bg-white/20"
                    : "bg-white/10 border border-white/20 text-primary text-2xl font-light active:bg-white/20",
                ].join(" ")}
              >
                {isDel ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.375-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z"
                    />
                  </svg>
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>

        {/* Privacy note */}
        <p className="text-primary/70 text-xs tracking-wide text-center leading-relaxed animate-slide-up">
          Your photo will be texted to this number and deleted immediately after the session.
        </p>

        {/* Continue */}
        {isValid && (
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary w-full animate-slide-up"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
