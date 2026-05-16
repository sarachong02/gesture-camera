import { useState } from "react";
import type { AppScreen, PhotoType } from "./types";
import StartScreen from "./screens/StartScreen";
import ChoiceScreen from "./screens/ChoiceScreen";
import CostScreen from "./screens/CostScreen";
import CameraScreen from "./screens/CameraScreen";
import CaptureScreen from "./screens/CaptureScreen";
import ThankYouScreen from "./screens/ThankYouScreen";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("start");
  const [photoType, setPhotoType] = useState<PhotoType>("digital");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  function handlePhotoTypeSelect(type: PhotoType) {
    setPhotoType(type);
    if (type === "physical") {
      setScreen("cost");
    } else {
      setScreen("camera");
    }
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
        <StartScreen onStart={() => setScreen("choice")} />
      )}
      {screen === "choice" && (
        <ChoiceScreen onSelect={handlePhotoTypeSelect} />
      )}
      {screen === "cost" && (
        <CostScreen onContinue={() => setScreen("camera")} />
      )}
      {screen === "camera" && (
        <CameraScreen
          photoType={photoType}
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
