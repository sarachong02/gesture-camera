export default function ThankYouScreen() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in px-8">
      {/* Ferry icon */}
      <div className="relative mb-14">
        <div className="w-24 h-24 rounded-full border border-primary/20 flex items-center justify-center">
          <svg
            className="w-11 h-11 text-primary/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 17H3l1.5-5H6m12 5h3l-1.5-5H18m-12 0h12m-9-5V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2m-4 0h4M3 20h18"
            />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-full border border-primary/10 animate-pulse-ring" />
      </div>

      {/* Headline */}
      <h1 className="font-display text-4xl font-normal text-primary text-center mb-5 animate-slide-up leading-snug">
        Thank you for using the
        <br />
        <span className="text-primary-dark">Washington State Ferry</span>
        <br />
        Photo Taker!
      </h1>

      {/* Divider */}
      <div className="w-12 h-px bg-primary/20 mb-6 animate-slide-up" />

      {/* Instruction */}
      <p className="text-primary/50 text-sm tracking-wide text-center max-w-xs leading-relaxed animate-slide-up">
        Navigate to a bulletin wall and share your memories!
      </p>

      {/* Wave decoration */}
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
