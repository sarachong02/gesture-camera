import logo from "../../images/logo.png";

interface Props {
  onRestart: () => void;
}

export default function ThankYouScreen({ onRestart }: Props) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in px-8" style={{ backgroundColor: "#0d1b22" }}>
      {/* Logo */}
      <div className="relative mb-14">
        <img src={logo} alt="Logo" style={{ width: "clamp(180px, 28vmin, 300px)", height: "clamp(180px, 28vmin, 300px)", objectFit: "contain" }} />
      </div>

      {/* Headline */}
      <h1 className="font-display text-4xl font-normal text-primary text-center mb-5 animate-slide-up leading-snug">
        Thank you for using the
        <br />
        <span className="text-primary-dark">Washington State Ferry</span>
        <br />
        Photo Spot!
      </h1>

      {/* Divider */}
      <div className="w-12 h-px bg-primary/20 mb-6 animate-slide-up" />

      {/* Instruction */}
      <p className="text-primary/70 text-sm tracking-wide text-center max-w-xs leading-relaxed animate-slide-up">
        Check your text messages for your image
      </p>

      {/* Restart */}
      <button
        type="button"
        onClick={onRestart}
        className="btn btn-primary animate-slide-up mt-8"
      >
        Restart
      </button>

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
