import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { HeroSection } from "../components/HeroSection";
import { CollectionEditorial } from "../components/CollectionEditorial";
import { LehengaReveal } from "../components/LehengaReveal";
import { OccasionExplorer } from "../components/OccasionExplorer";
import { TrousseauSection } from "../components/TrousseauSection";
import { StyleStudio } from "../components/StyleStudio";
import { MixAndMatch } from "../components/MixAndMatch";
import { PassportSection } from "../components/PassportSection";
import { BrandStory } from "../components/BrandStory";
import { CampaignBanner } from "../components/CampaignBanner";
import { FashionJournal } from "../components/FashionJournal";
import { SocialSection } from "../components/SocialSection";
import { TrustSection } from "../components/TrustSection";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { usePageMeta } from "../hooks/usePageMeta";

export default function Home() {
  const main = useRef<HTMLElement>(null);
  const { hash } = useLocation();
  useScrollReveal(main);
  usePageMeta("Mehfil Couture — Handcrafted Bridal, Luxury Prêt & Indo-Western · Indore");

  // Deep links like /#studio (also used when navigating home from an article)
  useEffect(() => {
    if (!hash) return;
    const t = window.setTimeout(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [hash]);

  return (
    <main id="main" ref={main}>
      <HeroSection />
      <CollectionEditorial />
      <LehengaReveal />
      <OccasionExplorer />
      <TrousseauSection />
      <StyleStudio />
      <MixAndMatch />
      <PassportSection />
      <BrandStory />
      <CampaignBanner />
      <FashionJournal />
      <SocialSection />
      <TrustSection />
    </main>
  );
}
