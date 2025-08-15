// src/components/home/home-page.tsx

'use client';

import '../../styles/home-page.css';
import Header from '@/components/home/header/header';
import { HomePageBackground } from '@/components/gradients/home-page-background';
import { Footer } from '@/components/home/footer/footer';
import { useAuth } from '@/hooks/useAuth';

// New V2 sections
import HeroV2 from '@/components/home/sections/hero-v2/Hero';
import WhatItIsV2 from '@/components/home/sections/explainer-v2/WhatItIs';
import OrchestratorV2 from '@/components/home/sections/orchestrator-v2/Orchestrator';
import ServicesV3 from '@/components/home/sections/services-v3/Services';
import CtaV2 from '@/components/home/sections/cta-v2/CTA';

export function HomePage() {
  const { user } = useAuth();

  return (
    <>
      <div className="relative dark">
        <HomePageBackground />
        <Header user={user} />
        <HeroV2 />
        <WhatItIsV2 />
        <OrchestratorV2 />
        <ServicesV3 />
        <CtaV2 />
        <Footer />
      </div>
    </>
  );
}
