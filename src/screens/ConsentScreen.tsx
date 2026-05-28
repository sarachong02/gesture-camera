import photoWallBg from "../../images/photo_wall_background.png";

interface Props {
  onConsent: (agreed: boolean) => void;
}

export default function ConsentScreen({ onConsent }: Props) {
  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center animate-fade-in px-8">
      {/* Background — photo wall image */}
      <img
        src={photoWallBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Icon — same ring container as ThankYouScreen */}
      <div className="relative mb-14">
        <div className="w-24 h-24 rounded-full border border-primary/20 flex items-center justify-center">
          <svg
            className="w-11 h-11 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-full border border-primary/10 animate-pulse-ring" />
      </div>

      {/* Headline */}
      <h1 className="font-display text-4xl font-normal text-white text-center mb-5 animate-slide-up leading-snug">
        Share your picture
      </h1>

      {/* Divider */}
      <div className="w-12 h-px bg-white/20 mb-6 animate-slide-up" />

      {/* Subheading + body */}
      <p className="text-white/70 text-sm tracking-wide text-center max-w-xs leading-relaxed animate-slide-up">
        Share your memories on the digital photo wall located on the ferry
      </p>
      <p className="text-white/70 text-sm tracking-wide text-center max-w-xs leading-relaxed animate-slide-up mt-3 mb-10">
        The photo will stay up for 48 hours, and then will be erased.
      </p>

      {/* Buttons */}
      <div className="flex flex-row gap-3 w-full max-w-lg animate-slide-up">
        <button onClick={() => onConsent(true)} className="btn btn-primary flex-1 text-xl">
          Yes, Share my memory!
        </button>
        <button onClick={() => onConsent(false)} className="btn btn-ghost flex-1 text-xl">
          No, I decline
        </button>
      </div>

      {/* Wave decoration — identical to ThankYouScreen */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none">
        <svg
          viewBox="0 0 1440 96"
          preserveAspectRatio="none"
          className="w-full h-full"
          fill="none"
        >
          <path
            d="M0 48 C240 80 480 16 720 48 C960 80 1200 16 1440 48 L1440 96 L0 96 Z"
            fill="rgba(26,101,123,0.06)"
          />
          <path
            d="M0 64 C360 96 720 32 1080 64 C1260 80 1380 56 1440 64 L1440 96 L0 96 Z"
            fill="rgba(26,101,123,0.04)"
          />
        </svg>
      </div>
    </div>
  );
}
