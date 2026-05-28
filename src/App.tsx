import { useState } from "react";
import type { AppScreen, FilterId } from "./types";
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
  const [screen, setScreen] = useState<AppScreen>("start");
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
    <div className="w-full h-full relative overflow-hidden">
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
  );
}
