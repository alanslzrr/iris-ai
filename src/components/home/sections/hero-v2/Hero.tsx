  // src/components/home/sections/hero-v2/Hero.tsx
  // This file contains the Hero component for the home page.
  // It is used to display the hero section of the home page.
  // The hero section is displayed in the home page.
  // The hero section is displayed in the home page.

  "use client";
  import React, { useEffect, useId } from "react";
  import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
    useMotionValue,
    animate,
    type MotionValue,
  } from "framer-motion";
  import { Button } from "@once-ui-system/core";

  /* ---------------- Motion variants ---------------- */

  const container = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.55,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.08,
      },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  };

  export default function HeroV2() {
    const prefersReducedMotion = useReducedMotion();
    const { scrollYProgress } = useScroll();
    // Gentle parallax for background flourishes if you need them later
    const yGrid = useTransform(scrollYProgress, [0, 1], [0, 40]);
    const yHalo = useTransform(scrollYProgress, [0, 1], [0, 24]);

    return (
      <section
        className="
          relative min-h-[90svh]
          grid grid-cols-12 gap-6 items-center
          px-6 md:px-10 lg:px-16 py-24
          overflow-hidden isolate
        "
      >
        {/* Left */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          className="relative z-[1] col-span-12 lg:col-span-7 xl:col-span-7 max-w-[70ch]"
        >
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md"
          >
            <span className="inline-flex size-2 rounded-full bg-[#f44336]/80 shadow-[0_0_0_3px_rgba(244,67,54,0.25)]" />
            <span className="text-[12px] uppercase tracking-[0.16em] text-white/70">
              New • AI-powered checks
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-4 font-semibold tracking-tight text-white [text-wrap:balance]"
            style={{
              fontSize: "clamp(3.5rem, 8vw, 7rem)",
              lineHeight: 1.04,
              letterSpacing: "-0.02em",
            }}
          >
            IRIS{" "}
            <span className="bg-gradient-to-r from-[#f44336] via-[#ff9800] to-[#ffeb3b] bg-clip-text text-transparent">
              AI
            </span>
          </motion.h1>

          <motion.h2
            variants={item}
            className="mt-6 text-[24px] leading-7 text-white max-w-[62ch] font-semibold"
          >
            Inspection and Review{" "}
            <span className="bg-gradient-to-r from-[#ff5722] via-[#ff9800] to-[#ffeb3b] bg-clip-text text-transparent">
              Intelligence
            </span>{" "}
            System
          </motion.h2>

          <motion.p
            variants={item}
            className="mt-40 text-[17px] leading-7 text-white/70 max-w-[62ch]"
          >
            Modern, automated compliance for calibration certificates. IRIS AI-powered,
            precise, and fast.
          </motion.p>

          <motion.ul
            variants={item}
            className="mt-6 grid w-full gap-x-6 gap-y-3 sm:grid-cols-2 text-white/75"
          >
            {[
              "Automated standard mapping",
              "Human-grade accuracy reports",
              "Batch imports & APIs",
              "Audit-ready trails",
            ].map((label) => (
              <li key={label} className="flex items-center gap-2">
                <span className="inline-block size-1.5 rounded-full bg-white/60" />
                <span className="text-sm">{label}</span>
              </li>
            ))}
          </motion.ul>

          <motion.div variants={item} className="mt-10 flex flex-wrap gap-4">
            <Button size="l" variant="primary" href="/signup" className="hero-primary-btn">
              Get Started Free
            </Button>
            <Button size="l" variant="secondary" href="/dashboard" className="hero-secondary-btn">
              View Demo
            </Button>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/50"
          >
            <div className="inline-flex items-center gap-2">
              <span className="icon-chip" aria-hidden>
                ✓
              </span>
              <span>ISO/IEC workflows baked in</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="icon-chip" aria-hidden>
                ⚡
              </span>
              <span>Sub-2s average check</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="icon-chip" aria-hidden>
                🔒
              </span>
              <span>SSO & role controls</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right: animated orchestrator card */}
        <div className="relative col-span-12 lg:col-span-5 xl:col-span-5 hidden lg:block">
          <motion.div
            className="glass-card hero-card mx-auto w-full max-w-[760px] rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.5)]"
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, -8, 0] }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 6, ease: "easeInOut", repeat: Infinity }
            }
          >
            <CardHeader />
            <MiniOrchestrator reduced={!!prefersReducedMotion} />
          </motion.div>
        </div>
      </section>
    );
  }

  /* ---------- Small subcomponents ---------- */

  function CardHeader() {
    return (
      <div className="mb-4 flex items-center gap-2 text-white/60 text-xs">
        <span className="size-2 rounded-full bg-[#f44336]/70" />
        <span className="size-2 rounded-full bg-[#ff9800]/70" />
        <span className="size-2 rounded-full bg-[#ffeb3b]/70" />
        <span className="ml-2">orchestrator-flow.tsx</span>
      </div>
    );
  }

  /* ---------- Coordinated Orchestrator (no return lines) ---------- */

  function MiniOrchestrator({ reduced }: { reduced: boolean }) {
    const id = useId();

    // Outcomes per loop:
    // 1) Tol FAIL, 2) All PASS, 3) Req FAIL, then repeat.
    type Outcome = "pass" | "fail";
    const OUTCOMES: Array<{ req: Outcome; cmc: Outcome; tol: Outcome }> = [
      { req: "pass", cmc: "pass", tol: "fail" },
      { req: "pass", cmc: "pass", tol: "pass" },
      { req: "fail", cmc: "pass", tol: "pass" },
    ];
    const [loop, setLoop] = React.useState(0);
    const pattern = OUTCOMES[loop % OUTCOMES.length];

    // Radii (keep in sync with circles)
    const RAD = { upload: 22, orchestrator: 28, service: 24 };

    // Subtle breathing on nodes (respect reduced motion)
    const cycle = {
      ease: "easeInOut" as const,
      repeat: Infinity,
      repeatDelay: 1.25,
    };

    // helper: circle node
    const C = (x: number, y: number, r: number, label: string, sub?: string) => (
      <g transform={`translate(${x} ${y})`}>
        <motion.circle
          r={r}
          className="fill-white/[0.03]"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="1.25"
          initial={{ scale: 0.98, opacity: 0.9 }}
          animate={
            reduced
              ? undefined
              : { scale: [0.98, 1.02, 0.98], opacity: [0.9, 1, 0.9] }
          }
          transition={reduced ? undefined : { ...cycle, duration: 3.2 }}
        />
        <text y={4} textAnchor="middle" className="fill-white/80" style={{ fontSize: 12, fontWeight: 600 }}>
          {label}
        </text>
        {sub && (
          <text y={20} textAnchor="middle" className="fill-white/50" style={{ fontSize: 10 }}>
            {sub}
          </text>
        )}
      </g>
    );

    // Edge-to-edge connectors
    function connectHorizontal(
      A: { x: number; y: number },
      rA: number,
      B: { x: number; y: number },
      rB: number,
      bend = 0.42
    ) {
      const start = { x: A.x + rA, y: A.y }; // right edge of A
      const end = { x: B.x - rB, y: B.y }; // left edge of B
      const dx = end.x - start.x;
      return `M${start.x},${start.y} C ${start.x + bend * dx},${start.y} ${end.x - bend * dx},${end.y} ${end.x},${end.y}`;
    }
    // Orchestrator -> Service (down)
    function connectDownArc(
      A: { x: number; y: number },
      rA: number,
      B: { x: number; y: number },
      rB: number,
      bend = 0.65,
      nudgeX = 0
    ) {
      const start = { x: A.x, y: A.y + rA }; // bottom of A
      const end = { x: B.x, y: B.y - rB }; // top of B
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.hypot(dx, dy);
      const k = dist * bend;
      const c1 = { x: start.x + nudgeX, y: start.y + k };
      const c2 = { x: end.x - nudgeX, y: end.y - k };
      return `M${start.x},${start.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`;
    }

    // layout
    const U = { x: 60, y: 46 };
    const O = { x: 280, y: 92 };
    const R = { x: 130, y: 210 }; // Requirements
    const CMC = { x: 280, y: 210 };
    const T = { x: 430, y: 210 };

    /* ----------------- MASTER CLOCK ----------------- */
    // One loop from 0 -> 1 orchestrates everything with linear time.
    const progress = useMotionValue(0);

    // Loop timing (seconds)
    const LOOP = 4.8; // active animation
    const IDLE = 1.0; // pause between loops
    const toN = (sec: number) => sec / LOOP; // convert seconds → 0..1

    // Drive the loop manually so we can rotate outcomes reliably per cycle
    useEffect(() => {
      if (reduced) {
        progress.set(1);
        return;
      }
      let cancelled = false;

      const startLoop = () => {
        const stop = animate(progress, 1, {
          duration: LOOP,
          ease: "linear",
          onComplete: () => {
            if (cancelled) return;
            setTimeout(() => {
              setLoop((n) => (n + 1) % OUTCOMES.length);
              progress.set(0);
              startLoop();
            }, IDLE * 1000);
          },
        });
        return stop;
      };

      const stop = startLoop();
      return () => {
        cancelled = true;
        stop.stop();
      };
    }, [reduced, progress]);

    // Helpers to slice the loop into segments
    const seg = (a: number, b: number) =>
      useTransform(progress, [a, b], [0, 1], { clamp: true });
    const gate = (a: number, b: number, from = 0, to = 1) =>
      useTransform(progress, [a, b], [from, to], { clamp: true });

    // ---- Timeline (normalized 0..1) ----
    // Upload -> Orchestrator
    const sUpload = seg(toN(0.00), toN(0.86)); // ~0.86s

    // Fan-out: slight cascade for rhythm (finish times staggered)
    const sReq = seg(toN(1.05), toN(2.05));
    const sCMC = seg(toN(1.35), toN(2.30));
    const sTol = seg(toN(1.65), toN(2.55));

    // Pulses (begin exactly as each path completes)
    const pReq = gate(toN(2.05), toN(2.35));
    const pCMC = gate(toN(2.30), toN(2.60));
    const pTol = gate(toN(2.55), toN(2.85));

    // Badges & report chips (a beat after pulse)
    const bReq = gate(toN(2.15), toN(3.40));
    const bCMC = gate(toN(2.45), toN(3.65));
    const bTol = gate(toN(2.75), toN(3.90));

    const cReq = gate(toN(2.20), toN(3.40));
    const cCMC = gate(toN(2.50), toN(3.65));
    const cTol = gate(toN(2.80), toN(3.90));

    // Fade to reset near the end
    const fadeOutMV = gate(toN(4.20), toN(4.80), 1, 0);

    // Derived transforms for pulses & chips
    const pulseScaleReq = useTransform(pReq, [0, 1], [0.85, 1.35]);
    const pulseScaleCMC = useTransform(pCMC, [0, 1], [0.85, 1.35]);
    const pulseScaleTol = useTransform(pTol, [0, 1], [0.85, 1.35]);

    const chipYReq = useTransform(cReq, [0, 1], [-4, 0]);
    const chipYCMC = useTransform(cCMC, [0, 1], [-4, 0]);
    const chipYTol = useTransform(cTol, [0, 1], [-4, 0]);

    // Helpers for current PASS/FAIL text
    const textFor = (o: Outcome) => (o === "pass" ? "PASS" : "FAIL");

    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
        <div className="mb-3 flex items-center justify-between text-[12px] text-white/60">
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex size-1.5 rounded-full bg-[#f44336]" />
            <span>Upload → Orchestrator → 3 services</span>
          </div>
          <div className="inline-flex items-center gap-1">
            <span className="text-white/50">~3 min</span>
          </div>
        </div>

        <svg
          viewBox="0 0 600 300"
          preserveAspectRatio="xMidYMid meet"
          className="block w-full"
          role="img"
          aria-label="Orchestrator flow"
        >
          <defs>
            <linearGradient id={`g-${id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgba(244,67,54,0.9)" />
              <stop offset="60%" stopColor="rgba(255,152,0,0.9)" />
              <stop offset="100%" stopColor="rgba(255,235,59,0.9)" />
            </linearGradient>
            <linearGradient id={`g-soft-${id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
            </linearGradient>
          </defs>

          {/* Upload -> Orchestrator */}
          <motion.path
            d={connectHorizontal(U, RAD.upload, O, RAD.orchestrator, 0.42)}
            fill="none"
            stroke={`url(#g-soft-${id})`}
            strokeWidth="1.6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            /* Hide until measured so pathLength draws cleanly */
            strokeDasharray="0 1"
            style={{ pathLength: sUpload, opacity: reduced ? 1 : fadeOutMV }}
            initial={false}
          />

          {/* Orchestrator -> 3 services (fan-out) */}
          <motion.path
            d={connectDownArc(O, RAD.orchestrator, R, RAD.service, 0.55, -6)}
            fill="none"
            stroke={`url(#g-${id})`}
            strokeWidth="1.8"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="0 1"
            style={{ pathLength: sReq, opacity: reduced ? 1 : fadeOutMV }}
            initial={false}
          />
          <motion.path
            d={connectDownArc(O, RAD.orchestrator, CMC, RAD.service, 0.9, 24)}
            fill="none"
            stroke={`url(#g-${id})`}
            strokeWidth="1.8"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="0 1"
            style={{ pathLength: sCMC, opacity: reduced ? 1 : fadeOutMV }}
            initial={false}
          />
          <motion.path
            d={connectDownArc(O, RAD.orchestrator, T, RAD.service, 0.65, 6)}
            fill="none"
            stroke={`url(#g-${id})`}
            strokeWidth="1.8"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="0 1"
            style={{ pathLength: sTol, opacity: reduced ? 1 : fadeOutMV }}
            initial={false}
          />

          {/* Nodes */}
          {C(U.x, U.y, RAD.upload, "Upload", "certificate.pdf")}
          {C(O.x, O.y, RAD.orchestrator, "Orchestrator")}
          {C(R.x, R.y, RAD.service, "Requirements")}
          {C(CMC.x, CMC.y, RAD.service, "CMC")}
          {C(T.x, T.y, RAD.service, "Tolerance")}

          {/* Pulses (sync to line completion) */}
          <motion.circle
            cx={R.x}
            cy={R.y}
            r={30}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
            style={{ scale: pulseScaleReq, opacity: pReq }}
          />
          <motion.circle
            cx={CMC.x}
            cy={CMC.y}
            r={30}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
            style={{ scale: pulseScaleCMC, opacity: pCMC }}
          />
          <motion.circle
            cx={T.x}
            cy={T.y}
            r={30}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
            style={{ scale: pulseScaleTol, opacity: pTol }}
          />

          {/* Result badges — dynamic per loop */}
          <ResultBadge
            x={R.x}
            y={R.y + 40}
            text={textFor(pattern.req)}
            tone={pattern.req}
            show={bReq}
          />
          <ResultBadge
            x={CMC.x}
            y={CMC.y + 40}
            text={textFor(pattern.cmc)}
            tone={pattern.cmc}
            show={bCMC}
          />
          <ResultBadge
            x={T.x}
            y={T.y + 40}
            text={textFor(pattern.tol)}
            tone={pattern.tol}
            show={bTol}
          />

          {/* Report chips */}
          <g transform={`translate(${R.x - 26} ${R.y - 54})`}>
            <motion.g style={{ opacity: cReq, y: chipYReq }}>
              <rect width="52" height="16" rx="6" className="fill-white/10" />
              <text
                x="26"
                y="11"
                textAnchor="middle"
                className="fill-white/70"
                style={{ fontSize: 9 }}
              >
                report.json
              </text>
            </motion.g>
          </g>
          <g transform={`translate(${CMC.x - 26} ${CMC.y - 54})`}>
            <motion.g style={{ opacity: cCMC, y: chipYCMC }}>
              <rect width="52" height="16" rx="6" className="fill-white/10" />
              <text
                x="26"
                y="11"
                textAnchor="middle"
                className="fill-white/70"
                style={{ fontSize: 9 }}
              >
                report.json
              </text>
            </motion.g>
          </g>
          <g transform={`translate(${T.x - 26} ${T.y - 54})`}>
            <motion.g style={{ opacity: cTol, y: chipYTol }}>
              <rect width="52" height="16" rx="6" className="fill-white/10" />
              <text
                x="26"
                y="11"
                textAnchor="middle"
                className="fill-white/70"
                style={{ fontSize: 9 }}
              >
                report.json
              </text>
            </motion.g>
          </g>
        </svg>
      </div>
    );
  }

  function ResultBadge({
    x,
    y,
    text,
    tone,
    show,
  }: {
    x: number;
    y: number;
    text: "PASS" | "FAIL";
    tone: "pass" | "fail";
    show: MotionValue<number>; // 0..1 from the shared clock
  }) {
    const fill = tone === "pass" ? "rgba(67,160,71,0.22)" : "rgba(239,83,80,0.22)";
    const stroke = tone === "pass" ? "rgba(76,175,80,0.6)" : "rgba(244,67,54,0.7)";
    const dot = tone === "pass" ? "#4caf50" : "#f44336";
    const yLift = useTransform(show, [0, 1], [-4, 0]); // subtle pop-in

    return (
      <g transform={`translate(${x - 30} ${y})`}>
        <motion.g style={{ opacity: show, y: yLift }}>
          <rect width="60" height="18" rx="9" fill={fill} stroke={stroke} strokeWidth="1" />
          <circle cx="10" cy="9" r="3" fill={dot} />
          <text
            x="32"
            y="12"
            textAnchor="middle"
            className="fill-white/80"
            style={{ fontSize: 10, fontWeight: 700 }}
          >
            {text}
          </text>
        </motion.g>
      </g>
    );
  }
