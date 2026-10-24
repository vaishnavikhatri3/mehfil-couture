import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AnnouncementBar } from "./components/AnnouncementBar";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { WhatsAppButton } from "./components/WhatsAppButton";
import { Toaster } from "./components/Toaster";
import { ConsentBanner } from "./components/ConsentBanner";
import { TryOnLens } from "./components/TryOnLens";
import { ZoomViewer } from "./components/ZoomViewer";
import { MeasurementPassport } from "./components/MeasurementPassport";
import { TrousseauPlanner } from "./components/TrousseauPlanner";
import Home from "./pages/Home";
import Article from "./pages/Article";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

// New tools & pages load on demand so the homepage stays light
const FitCheck = lazy(() => import("./pages/FitCheck"));
const Passport = lazy(() => import("./pages/Passport"));
const OrderStatus = lazy(() => import("./pages/OrderStatus"));
const Admin = lazy(() => import("./pages/admin/Admin"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Loading = () => <main id="main" className="wrap" style={{ padding: "18vh 0" }} aria-busy="true" />;

function Layout() {
  const { pathname, hash } = useLocation();
  // Utility pages (QR passport, FitCheck, order timeline) keep the screen clear of the try-on lens button
  const isTool = /^\/(p|fitcheck|order)(\/|$)/.test(pathname);

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
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
      <Footer />
      <TrousseauPlanner />
      <MeasurementPassport />
      {!isTool && <TryOnLens />}
      <WhatsAppButton />
      <ConsentBanner />
      <Toaster />
      <ZoomViewer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="admin"
          element={
            <Suspense fallback={<Loading />}>
              <Admin />
            </Suspense>
          }
        />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="product/festive-statement-lehenga" element={<ProductDetail />} />
          <Route path="product/mayuri-lehenga" element={<ProductDetail />} />
          <Route path="pieces/mayuri" element={<ProductDetail />} />
          <Route path="shop" element={<ProductDetail />} />
          <Route path="journal/:slug" element={<Article />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="fitcheck" element={<FitCheck />} />
          <Route path="p/:code" element={<Passport />} />
          <Route path="order/:id" element={<OrderStatus />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
