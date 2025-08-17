// src/components/home/illustrations/ToleranceSearchFunnel.tsx
// This file contains the ToleranceSearchFunnel component for the home page.
// It is used to display the tolerance search funnel animation in the home page.
// The tolerance search funnel animation is displayed in the home page.
// The tolerance search funnel animation is displayed in the home page.

"use client";
import React, { memo, useEffect, useId, useMemo, useRef } from "react";
import {
  motion,
  MotionValue,
  useTransform,
  useMotionValue,
  animate,
  AnimationPlaybackControls,
} from "framer-motion";

export type Level = { key: string; label: string; color?: string };

type Props = {
  className?: string;
  levels?: Level[];
  progressMV?: MotionValue<number>; // 0..1 (required for fluidity)
  rowGap?: number;
  rowWidth?: number;
  rowHeight?: number;
  left?: number;
  right?: number;
  ariaLabel?: string;
  ariaDescription?: string;
  interactiveScrub?: boolean;
  onScrub?: (ratio: number) => void;
  /** controls width of the emphasis falloff; bigger = softer */
  falloffSigma?: number; // default 0.9

  /** NEW: when true (default) and no external progressMV is provided, autoplay 0->1 and hard-reset to 0 */
  loop?: boolean;
  /** NEW: seconds it takes to go from 0 -> 1 in autoplay (default 4s) */
  autoplayDuration?: number;
};

const DEFAULT_LEVELS: Level[] = [
  { key: "l1", label: "L1 · Rules", color: "#f44336" },
  { key: "l2", label: "L2 · Procedures", color: "#ff9800" },
  { key: "l25", label: "L2.5 · Self", color: "#ffc107" },
  { key: "l3", label: "L3 · Manuals", color: "#03a9f4" },
  { key: "l4", label: "L4 · Extract+Validate", color: "#8bc34a" },
  { key: "l5", label: "L5 · Guided Web", color: "#9c27b0" },
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export default memo(function ToleranceSearchFunnel({
  className,
  levels = DEFAULT_LEVELS,
  progressMV,
  rowGap = 40,
  rowWidth = 240,
  rowHeight = 28,
  left = 24,
  right = 28,
  ariaLabel = "Tolerance search funnel",
  ariaDescription = "Hierarchical search from rules to guided web.",
  interactiveScrub = true,
  onScrub,
  falloffSigma = 0.9,

  loop = true,
  autoplayDuration = 4,
}: Props) {
  const id = useId();
  const maxIdx = Math.max(0, levels.length - 1);
  const top = 24, bottom = 24;

  const vb = useMemo(() => {
    const w = left + rowWidth + right;
    const h = top + (levels.length - 1) * rowGap + rowHeight + bottom;
    return { w, h };
  }, [levels.length, left, right, rowWidth, rowHeight, rowGap]);

  const positions = useMemo(
    () => levels.map((_, i) => top + i * rowGap),
    [levels, rowGap]
  );

  const spineX = left + rowWidth + Math.min(18, Math.max(0, right - 10));

  // ---- Active progress: use external MV if provided; otherwise internal with autoplay
  const internalMV = useMotionValue(0);
  const usingInternal = !progressMV;
  const activeMV = (progressMV ?? internalMV) as MotionValue<number>;

  const animRef = useRef<AnimationPlaybackControls | null>(null);
  const startAutoplay = (fromRatio?: number) => {
    // Stop any existing loop
    animRef.current?.stop();
    if (!loop || !usingInternal) return;

    if (typeof fromRatio === "number") internalMV.set(clamp01(fromRatio));

    // Animate to 1 with remaining duration, then loop (hard reset to 0 each cycle)
    const v = internalMV.get();
    const firstLeg = Math.max(0, 1 - v) * autoplayDuration;

    animRef.current = animate(
      internalMV,
      1,
      {
        ease: "linear",
        duration: Math.max(0.0001, firstLeg),
        // After reaching 1 the animation restarts from 0 instantly (no backtrack)
        repeat: Infinity,
        repeatType: "loop",
        // For subsequent loops, duration should be full
        // Framer Motion uses the same transition for repeats; since we'll have
        // reached 1 and looped back to 0, duration becomes autoplayDuration.
      }
    );
  };

  useEffect(() => {
    if (usingInternal && loop) startAutoplay();
    return () => animRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingInternal, loop, autoplayDuration]);

  // map progress (0..1) -> float index (0..maxIdx)
  const idxMV = useTransform(activeMV, (p) => clamp01(p) * maxIdx);

  // pointer scrubbing along Y
  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactiveScrub) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const first = positions[0];
    const last = positions[positions.length - 1];
    const ratio = clamp01((y - first) / (last - first || 1));

    if (onScrub) {
      onScrub(ratio);
    } else if (usingInternal) {
      // If no external handler, scrub the internal MotionValue directly
      internalMV.set(ratio);
    }
  };

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${vb.w} ${vb.h}`}
        width="100%"
        height="100%"
        role="img"
        aria-label={ariaLabel}
        aria-description={ariaDescription}
        style={{
          display: "block",
          background: "transparent",
          touchAction: "none",
          userSelect: "none",
        }}
        shapeRendering="geometricPrecision"
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={(e) => {
          if (!interactiveScrub) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          // Pause autoplay when the user interacts (internal mode only)
          if (usingInternal && loop) animRef.current?.stop();
          onPointer(e);
        }}
        onPointerMove={(e) => {
          if (!interactiveScrub) return;
          if (e.buttons === 1) onPointer(e);
        }}
        onPointerUp={(e) => {
          try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
          // Resume autoplay from the current ratio (internal mode only)
          if (usingInternal && loop) startAutoplay(internalMV.get());
        }}
      >
        <defs>
          {/* gradient used only for strokes (no row fills) */}
          <linearGradient id={`${id}-flow`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f44336" />
            <stop offset="50%" stopColor="#ff9800" />
            <stop offset="100%" stopColor="#ffeb3b" />
          </linearGradient>
        </defs>

        {/* spine */}
        <line
          x1={spineX}
          y1={positions[0]}
          x2={spineX}
          y2={positions[positions.length - 1] + rowHeight}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* rows (no filling gradient; just frames + labels) */}
        {levels.map((lvl, i) => {
          // Gaussian falloff around active index
          const emphasis = useTransform(idxMV, (f) => {
            const d = Math.abs(i - f);
            const sigma = Math.max(0.35, falloffSigma);
            return Math.exp(-(d * d) / (2 * sigma * sigma)); // 0..1
          });

          const frameOpacity = useTransform(emphasis, (v) => 0.10 + v * 0.50); // 0.1..0.6
          const labelOpacity = useTransform(emphasis, (v) => 0.25 + v * 0.75); // 0.25..1
          const scale = useTransform(emphasis, (v) => 1 + v * 0.02);

          return (
            <g key={lvl.key} transform={`translate(${left} ${positions[i]})`}>
              {/* frame — stroke only */}
              <motion.rect
                width={rowWidth}
                height={rowHeight}
                rx={Math.min(7, rowHeight / 2)}
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                vectorEffect="non-scaling-stroke"
                style={{ opacity: frameOpacity, scale }}
              />
              {/* label */}
              <motion.text
                x={16}
                y={rowHeight / 2}
                dominantBaseline="middle"
                fontSize={Math.min(12, rowHeight * 0.42)}
                fill="#fff"
                style={{ opacity: labelOpacity as any }}
              >
                {lvl.label}
              </motion.text>
            </g>
          );
        })}

        {/* active outline + token (only moving border) */}
        {(() => {
          const yMV = useTransform(idxMV, (f) => {
            const y0 = positions[0] + rowHeight / 2;
            const yN = positions[positions.length - 1] + rowHeight / 2;
            return y0 + (yN - y0) * (f / Math.max(1, maxIdx));
          });
          const outlineY = useTransform(yMV, (v) => v - (rowHeight + 4) / 2);
          return (
            <>
              <motion.rect
                x={left - 2}
                y={outlineY as any}
                width={rowWidth + 4}
                height={rowHeight + 4}
                rx={Math.min(9, (rowHeight + 4) / 2)}
                fill="none"
                stroke={`url(#${id}-flow)`}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
                style={{ filter: "drop-shadow(0 0 6px rgba(255,235,59,0.35))" }}
                transition={{ type: "spring", stiffness: 240, damping: 32, mass: 0.6 }}
              />
              <motion.circle
                r={4}
                cx={spineX}
                cy={yMV as any}
                fill="#ffeb3b"
                pointerEvents="none"
                transition={{ type: "spring", stiffness: 240, damping: 32, mass: 0.6 }}
              />
            </>
          );
        })()}
      </svg>
    </div>
  );
});
