// src/components/home/footer/built-using-tools.tsx

import { RevealFx } from '@once-ui-system/core';
import Image from 'next/image';

export function BuiltUsingTools() {
  const logos = [
    { src: '/assets/icons/logo/tailwind-logo.svg', alt: 'TailwindCSS logo', width: 194, height: 24 },
    { src: '/assets/icons/logo/supabase-logo.svg', alt: 'Supabase logo', width: 150, height: 32 },
    { src: '/assets/icons/logo/nextjs-logo.svg', alt: 'Next.js logo', width: 120, height: 24 },
    { src: '/assets/icons/logo/shadcn-logo.svg', alt: 'Shadcn logo', width: 137, height: 32 },
  ];

  return (
    <RevealFx delay={0.1} translateY={0.3}>
      <div className={'mx-auto max-w-7xl text-center px-8 mt-24 mb-16'}>
        <span className={'text-base'}>Built with</span>
        <div className={'infinite-carousel mt-8'}>
          <div className={'infinite-carousel__track'}>
            <ul className={'infinite-carousel__list'}>
              {logos.map((logo, index) => (
                <li key={`logo-a-${index}`} className={'infinite-carousel__item'}>
                  <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} />
                </li>
              ))}
            </ul>
            <ul className={'infinite-carousel__list'} aria-hidden="true">
              {logos.map((logo, index) => (
                <li key={`logo-b-${index}`} className={'infinite-carousel__item'}>
                  <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </RevealFx>
  );
}
