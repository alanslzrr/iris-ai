// src/components/home/illustrations/PhoenixCalibrationAnimation.tsx
// This file contains the PhoenixCalibrationAnimation component for the home page.
// It is used to display the Phoenix calibration animation in the home page.
// The Phoenix calibration animation is displayed in the home page.
// The Phoenix calibration animation is displayed in the home page.

"use client";

import React from "react";
import {
  animate,
  MotionValue,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  MotionConfig,
} from "framer-motion";
import ToleranceSearchFunnel, { Level } from "./ToleranceSearchFunnel";
import ToleranceWorkflow from "./ToleranceWorkflow";

type Step = { key: string; label: string; width?: number };

type Props = {
  className?: string;
  levels?: Level[];
  steps?: Step[];
  totalMeasurePoints?: number;
  startAtPoints?: number;
  cycleSeconds?: number;
  pauseOnHover?: boolean;
  interactiveScrub?: boolean;
  /** How the progress loop repeats. "reverse" avoids 1→0 jumps. */
  loopMode?: "loop" | "reverse";
};

export default function PhoenixCalibrationAnimation({
  className,
  levels = [
    { key: "l1", label: "L1 · Rules", color: "#f44336" },
    { key: "l2", label: "L2 · Procedures", color: "#ff9800" },
    { key: "l25", label: "L2.5 · Self", color: "#ffc107" },
    { key: "l3", label: "L3 · Manuals", color: "#03a9f4" },
    { key: "l4", label: "L4 · Extract+Validate", color: "#8bc34a" },
    { key: "l5", label: "L5 · Guided Web", color: "#9c27b0" },
  ],
  steps = [
    { key: "s1", label: "Digitize & Standardize", width: 168 },
    { key: "s2", label: "Spec Search (L1→L5)", width: 208 },
    { key: "s3", label: "Tolerance Assessment", width: 196 },
  ],
  totalMeasurePoints = 16,
  startAtPoints = 4,
  cycleSeconds = 6,
  pauseOnHover = true,
  interactiveScrub = true,
  loopMode = "reverse", // NEW: ping-pong by default for seamless ends
}: Props) {
  const reduce = useReducedMotion();
  const maxIdx = Math.max(0, levels.length - 1);

  // master timeline 0..1
  const progress: MotionValue<number> = useMotionValue(0);

  // spring-smooth everything that reads from progress
  const smooth = useSpring(progress, { stiffness: 180, damping: 26, mass: 0.55 });

  // derived read-only values for text/labels (throttled setState)
  const [ratio, setRatio] = React.useState(0);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [liveLabel, setLiveLabel] = React.useState(levels[0]?.label ?? "");
  const [showChecklist, setShowChecklist] = React.useState(false);

  // Visuals: still read from the spring for buttery motion
  useMotionValueEvent(smooth, "change", (p) => {
    const r = Math.max(0, Math.min(1, p));
    const idxFloat = r * maxIdx;
    const idxNearest = Math.round(idxFloat);
    setRatio(r);
    if (idxNearest !== activeIndex) setActiveIndex(idxNearest);
    if (levels[idxNearest]?.label !== liveLabel) setLiveLabel(levels[idxNearest]?.label ?? "");
  });

  // NEW: Logic/toggles use the raw driver to avoid end-of-loop glitches
  useMotionValueEvent(progress, "change", (p) => {
    // hysteresis: appear late, disappear immediately on wrap
    if (p < 0.02) setShowChecklist(false);
    else if (p > 0.97) setShowChecklist(true);
  });

  // duration-based loop driver (imperative MV animation per docs) :contentReference[oaicite:3]{index=3}
  React.useEffect(() => {
    if (reduce) {
      progress.set(1);
      return;
    }
    const controls = animate(progress, 1, {
      duration: Math.max(2, cycleSeconds),
      ease: "linear",
      repeat: Infinity,
      repeatType: loopMode, // NEW: "reverse" (ping-pong) by default :contentReference[oaicite:4]{index=4}
      repeatDelay: 0.6,
    });
    return () => controls.stop();
  }, [progress, cycleSeconds, reduce, loopMode]);

  // hover pause/resume
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!pauseOnHover || reduce) return;
    const el = containerRef.current;
    if (!el) return;

    let paused = false;
    let resumeControls: ReturnType<typeof animate> | null = null;

    const pause = () => {
      if (paused) return;
      paused = true;
      progress.stop();
      resumeControls?.stop();
      resumeControls = null;
    };
    const resume = () => {
      if (!paused) return;
      paused = false;
      // Recreate the same repeating animation from the current value
      resumeControls = animate(progress, 1, {
        duration: Math.max(2, cycleSeconds) * (1 - progress.get()),
        ease: "linear",
        repeat: Infinity,
        repeatType: loopMode, // NEW
        repeatDelay: 0.6,
      });
    };

    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerleave", resume);
    return () => {
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerleave", resume);
    };
  }, [pauseOnHover, cycleSeconds, reduce, progress, loopMode]);

  // points: exact mapping to timeline so we land on total at the end of the cycle
  const pointsCovered = Math.max(
    0,
    Math.min(
      totalMeasurePoints,
      Math.round(startAtPoints + ratio * (totalMeasurePoints - startAtPoints))
    )
  );

  // expose a bounded MV ratio to the right panel too
  const smoothRatio = useTransform(smooth, (v) => Math.max(0, Math.min(1, v)));

  return (
    <MotionConfig reducedMotion="user">
      {/* respects the OS “reduced motion” setting site-wide :contentReference[oaicite:5]{index=5} */}
      <div
        ref={containerRef}
        className={className}
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 1fr) minmax(540px, 2fr)",
          gap: 28,
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* screenreader live region */}
        <div
          aria-live="polite"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
            whiteSpace: "nowrap",
          }}
        >
          {liveLabel}
        </div>

        <ToleranceSearchFunnel
          levels={levels}
          progressMV={smooth}
          falloffSigma={0.9}
          interactiveScrub={interactiveScrub && !reduce}
          onScrub={(r) => progress.set(r)}
          ariaLabel="Tolerance search levels"
          ariaDescription="Hierarchical levels from rules to guided web."
        />

        <ToleranceWorkflow
          steps={steps}
          progressRatio={ratio}
          progressMV={smoothRatio}
          pointsTotal={totalMeasurePoints}
          pointsCovered={pointsCovered}
          spinner
          ariaHidden
          loop={false}
          showChecklist={showChecklist}
          checklistItems={["Specs located", "Ranges verified", "Report prepared"]}
          height={270}
          top={92}
        />
      </div>
    </MotionConfig>
  );
}
