import { useEffect } from "react";
import { BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AnnouncementBar } from "./components/AnnouncementBar";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { WhatsAppButton } from "./components/WhatsAppButton";
import { Toaster } from "./components/Toaster";
import { ConsentBanner } from "./components/ConsentBanner";
import { TryOnLens } from "./components/TryOnLens";
import { MeasurementPassport } from "./components/MeasurementPassport";
import { TrousseauPlanner } from "./components/TrousseauPlanner";
import Home from "./pages/Home";
import Article from "./pages/Article";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

function Layout() {
  const { pathname, hash } = useLocation();

  // New page → start at the top (hash links are handled by the page itself)
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <AnnouncementBar />
      <Navigation />
      <Outlet />
      <Footer />
      <TrousseauPlanner />
      <MeasurementPassport />
      <TryOnLens />
      <WhatsAppButton />
      <ConsentBanner />
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="journal/:slug" element={<Article />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
