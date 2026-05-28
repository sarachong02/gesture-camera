import cityBg from "../../images/start_bg_city.jpg";
import overlayBg from "../../images/start_bg_overlay.jpg";

interface Props {
  onStart: () => void;
}

export default function StartScreen({ onStart }: Props) {
  return (
    <div className="w-full h-full relative overflow-hidden animate-fade-in" style={{ backgroundColor: "#0d1b22" }}>
      {/* Layered backgrounds */}
      <img
        src={cityBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <img
        src={overlayBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.75 }}
      />

      {/* Content — upper portion, mirrors Figma proportions */}
      <div className="absolute inset-0 flex flex-col items-center" style={{ paddingTop: "10%" }}>
        <h1
          className="text-white text-center animate-slide-up"
          style={{ fontFamily: "'Gilda Display', Georgia, serif", fontSize: "clamp(56px, 8vw, 100px)", fontWeight: 400, lineHeight: 1.05 }}
        >
          Photo Spot
        </h1>
        <p
          className="text-white text-center font-bold animate-slide-up"
          style={{ fontSize: "clamp(18px, 3vw, 40px)", marginTop: "0.5em", letterSpacing: "0.02em" }}
        >
          CAPTURE AND SHARE THE MOMENT
        </p>

        <button
          onClick={onStart}
          className="btn btn-primary animate-slide-up"
          style={{ marginTop: "clamp(24px, 3vh, 48px)" }}
        >
          Start
        </button>
      </div>
    </div>
  );
}
