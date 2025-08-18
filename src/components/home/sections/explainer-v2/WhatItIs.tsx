"use client";
import { Column } from '@once-ui-system/core';

export default function WhatItIsV2() {
  return (
    <section className="mx-auto max-w-7xl px-[32px] mt-32 mb-32">
      <div className="flex justify-center">
        <Column gap="20" className="w-full">
          <h1 className="font-semibold tracking-tight" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.08, letterSpacing: '-0.01em', maxWidth: '42ch' }}>
            AI‑powered certificate <span className="text-phoenix-gradient-bright">validation</span>
          </h1>

          <p className="text-[inherit]" style={{ color: 'var(--muted-foreground)', fontSize: 'clamp(1rem, 1.2vw, 1.25rem)', lineHeight: 1.5, maxWidth: '56ch' }}>
            IRIS AI checks calibration certificates—single or batch—against ISO/IEC 17025, manufacturer specs, and your policies. Precise, traceable, configurable.
          </p>

          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
            Batch orchestration • 1–3 minute validation • Audit‑grade traceability
          </p>
        </Column>
      </div>
    </section>
  );
}


