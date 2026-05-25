import { useState } from "react";
import type { AppScreen, FilterId } from "./types";
import StartScreen from "./screens/StartScreen";
import PhoneScreen from "./screens/PhoneScreen";
import FilterScreen from "./screens/FilterScreen";
import TutorialScreen from "./screens/TutorialScreen";
import CameraScreen from "./screens/CameraScreen";
import CaptureScreen from "./screens/CaptureScreen";
import ThankYouScreen from "./screens/ThankYouScreen";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("start");
  const [_phoneNumber, setPhoneNumber] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<FilterId>("orca");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

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
          onComplete={() => setScreen("camera")}
          onSkip={() => setScreen("camera")}
        />
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
          onRetake={handleRetake}
          onSave={() => setScreen("thankyou")}
        />
      )}
      {screen === "thankyou" && <ThankYouScreen />}
    </div>
  );
}
