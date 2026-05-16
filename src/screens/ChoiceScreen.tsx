import type { PhotoType } from "../types";

interface Props {
  onSelect: (type: PhotoType) => void;
}

export default function ChoiceScreen({ onSelect }: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] animate-fade-in">
      <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-14">
        Choose your format
      </p>

      <div className="flex gap-5">
        <button
          onClick={() => onSelect("digital")}
          className="group w-52 h-64 glass rounded-2xl flex flex-col items-center justify-center gap-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
        >
          <svg
            className="w-10 h-10 text-white/40 group-hover:text-white/70 transition-colors duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3"
            />
          </svg>
          <div className="text-center">
            <p className="text-white/80 text-sm font-medium tracking-wide">
              Digital Photo
            </p>
            <p className="text-white/30 text-xs mt-1">Free</p>
          </div>
        </button>

        <button
          onClick={() => onSelect("physical")}
          className="group w-52 h-64 glass rounded-2xl flex flex-col items-center justify-center gap-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
        >
          <svg
            className="w-10 h-10 text-white/40 group-hover:text-white/70 transition-colors duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
          <div className="text-center">
            <p className="text-white/80 text-sm font-medium tracking-wide">
              Digital + Physical
            </p>
            <p className="text-white/30 text-xs mt-1">$2.00</p>
          </div>
        </button>
      </div>
    </div>
  );
}
