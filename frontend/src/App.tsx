import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import TemplatePickerPage from "./pages/TemplatePickerPage";
import PlayerSetupPage from "./pages/PlayerSetupPage";
import ProcessingPage from "./pages/ProcessingPage";
import ResultPage from "./pages/ResultPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/templates" element={<TemplatePickerPage />} />
      <Route path="/setup" element={<PlayerSetupPage />} />
      <Route path="/processing/:jobId" element={<ProcessingPage />} />
      <Route path="/result/:jobId" element={<ResultPage />} />
    </Routes>
  );
}
