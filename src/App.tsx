import { useState } from "react";
import type { AppScreen, FilterId } from "./types";
import appBg from "../images/background_img.png";
import StartScreen from "./screens/StartScreen";
import PhoneScreen from "./screens/PhoneScreen";
import FilterScreen from "./screens/FilterScreen";
import TutorialScreen from "./screens/TutorialScreen";
import CameraGateScreen from "./screens/CameraGateScreen";
import CameraScreen from "./screens/CameraScreen";
import CaptureScreen from "./screens/CaptureScreen";
import ConsentScreen from "./screens/ConsentScreen";
import ThankYouScreen from "./screens/ThankYouScreen";

export default function App() {
  // TEMP: read the 'ios' class stamped by main.tsx before React mounted
  const [screen, setScreen] = useState<AppScreen>(() => {
    const ios = document.documentElement.classList.contains('ios');
    if (ios) console.log('[iOS fallback] start screen bypassed → routing to phone');
    return ios ? 'phone' : 'start';
  });
  const [_phoneNumber, setPhoneNumber] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<FilterId>("no_filter");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [_consentGiven, setConsentGiven] = useState<boolean | null>(null);

  function handlePhoneSubmit(phone: string) {
    setPhoneNumber(phone);
    setScreen("filter");
  }

  function handleFilterConfirm(filter: FilterId) {
    setActiveFilter(filter);
    setScreen("tutorial");
  }

  function handleCapture(dataUrl: string) {
    setCapturedImage(dataUrl);
    setScreen("capture");
  }

  function handleRetake() {
    setCapturedImage(null);
    setScreen("camera");
  }

  return (
    // backgroundColor provides an immediate dark fallback so text (sand/white) is
    // always readable even before the background image loads or if it fails.
    // The <img> replaces CSS background-image: iOS Safari has a known WebKit bug
    // where background-size:cover inside overflow:hidden doesn't render reliably.
    <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: "#0d1b22" }}>
      {/* Background image — z-index 0, explicitly behind screen content */}
      <img
        src={appBg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        style={{ zIndex: 0 }}
      />
      {/* Screen layer — z-index 1, always above background img.
          absolute inset-0 matches App dimensions; children use w-full h-full. */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        {screen === "start" && (
          <StartScreen onStart={() => setScreen("phone")} />
        )}
        {screen === "phone" && (
          <PhoneScreen onSubmit={handlePhoneSubmit} />
        )}
        {screen === "filter" && (
          <FilterScreen
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onConfirm={handleFilterConfirm}
          />
        )}
        {screen === "tutorial" && (
          <TutorialScreen
            onComplete={() => setScreen("camera_gate")}
            onSkip={() => setScreen("camera")}
          />
        )}
        {screen === "camera_gate" && (
          <CameraGateScreen onEnter={() => setScreen("camera")} />
        )}
        {screen === "camera" && (
          <CameraScreen
            activeFilter={activeFilter}
            onCapture={handleCapture}
          />
        )}
        {screen === "capture" && capturedImage && (
          <CaptureScreen
            imageUrl={capturedImage}
            activeFilter={activeFilter}
            onRetake={handleRetake}
            onSave={() => setScreen("consent")}
          />
        )}
        {screen === "consent" && (
          <ConsentScreen
            onConsent={(agreed) => {
              setConsentGiven(agreed);
              setScreen("thankyou");
            }}
          />
        )}
        {screen === "thankyou" && (
          <ThankYouScreen onRestart={() => {
            setPhoneNumber("");
            setActiveFilter("no_filter");
            setCapturedImage(null);
            setConsentGiven(null);
            setScreen("start");
          }} />
        )}
      </div>
    </div>
  );
}
