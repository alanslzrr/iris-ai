// src/components/home/illustrations/CmcPipeline.tsx
"use client";
import * as React from "react";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
  useAnimate,
} from "framer-motion";

/* ───────────────────── Data (minimal, monochrome icons) ───────────────────── */

type Step = { title: string; body: string; icon: React.ReactNode };

const Icons = {
  intake: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
    </svg>
  ),
  onboarding: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 4h9v6H4zM13 10l3 3 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  identify: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="10" cy="10" r="5" /><path d="M21 21l-5.5-5.5" strokeLinecap="round" />
    </svg>
  ),
  grouping: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  match: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12l4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  units: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 21h18M7 21V3m10 18V8" strokeLinecap="round"/>
    </svg>
  ),
  cmc: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 17l6-6 4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  compliance: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2l7 4v6a7 7 0 1 1-14 0V6l7-4z"/><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const STEPS: Step[] = [
  { title: "1. Intake", body: "Receive the certificate (PDF/JSON) and the accredited scope.", icon: Icons.intake },
  { title: "2. Onboarding and operational structuring", body: "Normalize input to a single schema. Extraction supports multi-language PDFs, complex/irregular tables, and OCR scans.", icon: Icons.onboarding },
  { title: "3. Parameter identification", body: "Identify magnitudes, ranges, units, and conditions for each measurement point.", icon: Icons.identify },
  { title: "4. Operational grouping", body: "Group by equipment type, parameter, and range to form homogeneous batches.", icon: Icons.grouping },
  { title: "5. Linkage to the accredited scope (matching)", body: "Map each parameter to its ISO/IEC 17025 scope category. Matching is performed by an LLM via an execute-function tool.", icon: Icons.match },
  { title: "6. Standardization of units", body: "Convert and harmonize units (including %↔absolute) into a common system for scope and measurements.", icon: Icons.units },
  { title: "7. Calculation of the applicable CMC", body: "Evaluate the scope’s CMC expression at the relevant point/range with aligned units.", icon: Icons.cmc },
  { title: "8. Compliance assessment", body: "Compare reported uncertainty vs. calculated CMC to label per-point compliance and aggregate metrics. Orchestrated via execute-function; numeric calculations are deterministic.", icon: Icons.compliance },
];

/* ───────────────────────────── Helpers ───────────────────────────── */

const mod = (n: number, m: number) => ((n % m) + m) % m;

type Props = { className?: string; intervalMs?: number };

/* ───────────────────────────── Component ───────────────────────────── */

export default function CmcPipeline3Levels({ className, intervalMs = 2400 }: Props) {
  const prefersReducedMotion = useReducedMotion();

  // Start with step 1 visible at the TOP (incoming).
  const [i, setI] = React.useState(STEPS.length - 1);
  const [paused, setPaused] = React.useState(false);

  // For wheel+drag scrubbing
  const wheelAccum = React.useRef(0);
  const lastWheel = React.useRef(0);
  const lastDragAccum = React.useRef(0);

  // Indices: MIDDLE focus, TOP incoming, BOTTOM outgoing
  const idxL2 = mod(i, STEPS.length);
  const idxL3 = mod(i + 1, STEPS.length);
  const idxL1 = mod(i - 1, STEPS.length);

  // Autoplay forward when not paused
  React.useEffect(() => {
    if (prefersReducedMotion || paused) return;
    const id = setInterval(() => setI((v) => mod(v + 1, STEPS.length)), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, prefersReducedMotion, paused]);

  const bump = (delta: number) => setI((v) => mod(v + delta, STEPS.length));

  // Gestures per Motion docs (dragElastic/dragMomentum). 
  const STEP_THRESHOLD = 44;

  const onTap: React.ComponentProps<typeof motion.section>["onTap"] = () => {
    bump(+1);
    setPaused(false);
  };

  const onDragStart: React.ComponentProps<typeof motion.section>["onDragStart"] = () => {
    setPaused(true);
    lastDragAccum.current = 0;
  };

  const onDrag: React.ComponentProps<typeof motion.section>["onDrag"] = (_evt, info) => {
    const delta = info.offset.y - lastDragAccum.current;
    let steps = 0;
    while (delta - steps * STEP_THRESHOLD >= STEP_THRESHOLD) steps++;
    while (delta - steps * STEP_THRESHOLD <= -STEP_THRESHOLD) steps--;
    if (steps !== 0) {
      bump(steps);
      lastDragAccum.current += steps * STEP_THRESHOLD;
    }
  };

  const onDragEnd: React.ComponentProps<typeof motion.section>["onDragEnd"] = () => {
    setPaused(false);
  };

  const onWheel: React.WheelEventHandler = (e) => {
    const now = performance.now();
    if (now - lastWheel.current < 40) return;
    lastWheel.current = now;
    setPaused(true);

    wheelAccum.current += e.deltaY;
    while (wheelAccum.current >= STEP_THRESHOLD) {
      bump(+1);
      wheelAccum.current -= STEP_THRESHOLD;
    }
    while (wheelAccum.current <= -STEP_THRESHOLD) {
      bump(-1);
      wheelAccum.current += STEP_THRESHOLD;
    }

    setTimeout(() => setPaused(false), 80);
  };

  const sideFade = prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" };

  // Coordinated layout moves via LayoutGroup + layout props.
  const layoutTransition =
    prefersReducedMotion ? undefined : { layout: { duration: 0.32, ease: [0.2, 0, 0.2, 1] } };

  return (
    <motion.section
      className={className}
      aria-label="CMC macro flow — three levels"
      onTap={onTap}
      onWheel={onWheel}
      drag="y"
      dragElastic={0.12}
      dragMomentum={false}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      style={{
        // brand gradient tokens for the rail (red → orange → yellow)
        ["--railStart" as any]: "#ff0033",
        ["--railMid"   as any]: "#ff8a00",
        ["--railEnd"   as any]: "#ffde59",
        ["--cardBg"    as any]: "rgba(255,255,255,0.04)",
        color: "white",
        touchAction: "pan-y pinch-zoom",
        userSelect: "none",
        willChange: "transform",
      }}
    >
      <LayoutGroup>
        <motion.div
          layout
          transition={layoutTransition}
          style={{
            display: "grid",
            gridTemplateColumns: "28px 1fr",
            gridTemplateRows: "1fr 18px 1fr 18px 1fr",
            columnGap: 16,
            rowGap: 10,
            maxWidth: 760,
            marginInline: "auto",
            contain: "layout paint",
            position: "relative",
          }}
        >
          {/* Full-height animated rail */}
          <AnimatedRail trigger={i} />

          {/* TOP (incoming) */}
          <RailNodeCell row={1} active={false} />
          <LevelShell focus={false} layoutTransition={layoutTransition} row={1}>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.article
                key={`L3-${idxL3}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={sideFade}
              >
                <LevelContent step={STEPS[idxL3]} />
              </motion.article>
            </AnimatePresence>
          </LevelShell>

          {/* spacer */}
          <div style={{ gridColumn: "1 / -1" }} />

          {/* MIDDLE (focus) */}
          <RailNodeCell row={3} active={true} />
          <LevelShell focus layoutTransition={layoutTransition} row={3}>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.article
                key={`L2-${idxL2}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={sideFade}
              >
                <LevelContent step={STEPS[idxL2]} />
              </motion.article>
            </AnimatePresence>
          </LevelShell>

          {/* spacer */}
          <div style={{ gridColumn: "1 / -1" }} />

          {/* BOTTOM (outgoing) */}
          <RailNodeCell row={5} active={false} />
          <LevelShell focus={false} layoutTransition={layoutTransition} row={5}>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.article
                key={`L1-${idxL1}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={sideFade}
              >
                <LevelContent step={STEPS[idxL1]} />
              </motion.article>
            </AnimatePresence>
          </LevelShell>
        </motion.div>
      </LayoutGroup>
    </motion.section>
  );
}

/* ─────────────────────────── Visual pieces ─────────────────────────── */

// Animated tri-stop vertical rail with a step-triggered "spark".
function AnimatedRail({
  duration = 3.2,
  delay = 0.2,
  trigger,
}: { duration?: number; delay?: number; trigger?: number }) {
  const id = React.useId();
  const prefersReducedMotion = useReducedMotion();
  const [scope, animate] = useAnimate();

  // Fire a bright spark down the rail on every step change.
  React.useEffect(() => {
    if (prefersReducedMotion) return;
    animate(
      `#${id}-spark`,
      { strokeDashoffset: [100, 0], opacity: [0, 1, 0] },
      { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
    );
  }, [trigger, animate, id, prefersReducedMotion]);

  return (
    <svg
      ref={scope as any}
      aria-hidden
      viewBox="0 0 28 100"
      preserveAspectRatio="none"
      style={{
        gridColumn: 1,
        gridRow: "1 / -1",
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,         // full column height
        width: 28,
        pointerEvents: "none",
        filter: "drop-shadow(0 0 8px rgba(255,176,0,0.38))",
      }}
    >
      <defs>
        {/* Tri-stop brand gradient in rail coordinates */}
        <linearGradient id={`${id}-base`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">
          <stop offset="0%"   stopColor="var(--railStart)" />
          <stop offset="50%"  stopColor="var(--railMid)" />
          <stop offset="100%" stopColor="var(--railEnd)" />
        </linearGradient>

        {/* Ambient moving sheen */}
        {!prefersReducedMotion && (
          <motion.linearGradient
            id={`${id}-sheen`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="0"
            initial={{ y1: -30, y2: 0 }}
            animate={{ y1: [-30, 130], y2: [0, 160] }}
            transition={{ duration, delay, ease: [0.16, 1, 0.3, 1], repeat: Infinity }}
          >
            <stop offset="0%"  stopColor="#fff" stopOpacity="0" />
            <stop offset="18%" stopColor="#fff" stopOpacity="0.65" />
            <stop offset="36%" stopColor="#fff" stopOpacity="0" />
          </motion.linearGradient>
        )}

        {/* Spark gradient */}
        <linearGradient id={`${id}-sparkGrad`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0" />
          <stop offset="12%"  stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="24%"  stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Subtle glow for the spark */}
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Base rail */}
      <path d="M14 0 L14 100" stroke={`url(#${id}-base)`} strokeWidth="2" strokeLinecap="round" />

      {/* Ambient sheen riding down the rail */}
      {!prefersReducedMotion && (
        <path
          d="M14 0 L14 100"
          stroke={`url(#${id}-sheen)`}
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.7}
        />
      )}

      {/* Step-triggered spark (short, bright segment).
         Implemented via stroke dashes for broad SVG compatibility. */}
      <motion.path
        id={`${id}-spark`}
        d="M14 0 L14 100"
        initial={{ strokeDashoffset: 100, opacity: 0 }}
        stroke={`url(#${id}-sparkGrad)`}
        strokeWidth="3"
        strokeLinecap="round"
        filter={`url(#${id}-glow)`}
        style={{ mixBlendMode: "screen" }}
        strokeDasharray="12 100"
      />
    </svg>
  );
}

// Small nodes aligned with each card (no icons/colors here)
function RailNodeCell({ row, active }: { row: 1 | 3 | 5; active: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        gridColumn: 1,
        gridRow: row,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      <motion.span
        layout
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          boxSizing: "border-box",
          border: "2px solid currentColor",
          color: "white",
          background: active ? "currentColor" : "transparent",
          opacity: active ? 1 : 0.7,
        }}
        animate={{ scale: active ? 1 : 0.9 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </div>
  );
}

// Card shell
function LevelShell({
  children,
  focus,
  row,
  layoutTransition,
}: {
  children: React.ReactNode;
  focus?: boolean;
  row: 1 | 3 | 5;
  layoutTransition?: React.ComponentProps<typeof motion.div>["transition"];
}) {
  return (
    <motion.div
      layout
      transition={layoutTransition}
      style={{
        gridColumn: 2,
        gridRow: row,
        background: "var(--cardBg)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 12,
        padding: "14px 16px",
        boxShadow: focus ? "0 12px 30px rgba(0,0,0,0.35)" : "none",
        transform: focus ? "scale(1.01)" : "scale(1.0)",
        opacity: focus ? 1 : 0.65,
        minHeight: focus ? 88 : 72,
        willChange: "transform",
      }}
    >
      {children}
    </motion.div>
  );
}

// Title row includes a small, monochrome icon (inherits currentColor).
function LevelContent({ step }: { step: Step }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span aria-hidden style={{ display: "inline-flex", opacity: 0.95 }}>{step.icon}</span>
        <motion.h3
          layout="position"
          style={{ margin: 0, fontSize: 16, lineHeight: 1.35, fontWeight: 700, minHeight: 22 }}
        >
          {step.title}
        </motion.h3>
      </div>
      <motion.p
        layout="position"
        style={{
          margin: "6px 0 0 0",
          fontSize: 14,
          lineHeight: 1.45,
          opacity: 0.9,
          minHeight: 40,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {step.body}
      </motion.p>
    </>
  );
}
