import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Global tokens/base first so component styles can override them.
import "./styles/base.css";
import App from "./App";

// Browsers restore scroll before GSAP pins exist — start fresh instead.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
