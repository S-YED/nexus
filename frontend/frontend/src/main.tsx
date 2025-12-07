import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { testCreatePoolDirect } from "./services/testDirect.ts";

createRoot(document.getElementById("root")!).render(<App />);

// Make test function available in console for debugging
(window as any).testCreatePoolDirect = testCreatePoolDirect;
