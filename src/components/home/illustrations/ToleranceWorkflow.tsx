// src/components/home/illustrations/ToleranceWorkflow.tsx
// This file contains the ToleranceWorkflow component for the home page.
// It is used to display the tolerance workflow animation in the home page.
// The tolerance workflow animation is displayed in the home page.
// The tolerance workflow animation is displayed in the home page.

"use client";
import { useEffect, useId, useMemo, useState } from "react";
import {
  motion,
  useReducedMotion,
  MotionValue,
  useTransform,
  useMotionValue,
  animate,
} from "framer-motion";

type Step = { key: string; label: string; width?: number };

type Props = {
  className?: string;
  steps?: Step[];
  height?: number;
  gap?: number;
  paddingX?: number;
  top?: number; // vertical offset for boxes (HUD reserved above)
  showToken?: boolean;
  loop?: boolean; // when true and no external progressMV is provided, autoplay from 0->1 and restart
  /** NEW: dwell between loops; set 0 for immediate restart */
  loopDwellMs?: number;
  ariaHidden?: boolean;
  progressRatio?: number; // 0..1 (used only when no MV & no loop)
  progressMV?: MotionValue<number>;
  pointsTotal?: number;
  pointsCovered?: number;
  spinner?: boolean;
  showChecklist?: boolean;
  checklistItems?: string[];
};

export default function ToleranceWorkflow({
  className,
  steps = [
    { key: "s1", label: "Digitize & Standardize", width: 168 },
    { key: "s2", label: "Spec Search (L1→L5)", width: 208 },
    { key: "s3", label: "Tolerance Assessment", width: 196 },
  ],
  height = 270,
  gap = 28,
  paddingX = 28,
  top = 92, // slightly larger to fully clear HUD
  showToken = false,
  loop = false,
  loopDwellMs = 900,
  ariaHidden = true,
  progressRatio = 0,
  progressMV,
  pointsTotal = 16,
  pointsCovered = 0,
  spinner = true,
  showChecklist = false,
  checklistItems = ["Specs located", "Ranges verified", "Report prepared"],
}: Props) {
  const reduce = useReducedMotion();
  const id = useId();

  // Layout constants
  const HUD_H = 46;
  const boxH = 52;
  const radius = 12;

  // ---- Layout + geometry
  const layout = useMemo(() => {
    let x = paddingX;
    const boxes = steps.map((s) => {
      const w = s.width ?? Math.max(140, Math.min(260, s.label.length * 7));
      const b = { ...s, x, y: top, w, h: boxH } as const;
      x += w + gap;
      return b;
    });
    const width = boxes.length
      ? boxes[boxes.length - 1].x + boxes[boxes.length - 1].w + paddingX
      : 360;
    return { width, boxes };
  }, [steps, gap, paddingX, top]);

  const connectors = useMemo(() => {
    const pts: Array<{ d: string }> = [];
    const cubic = (sx: number, sy: number, ex: number, ey: number) => {
      const mx = (sx + ex) / 2;
      return `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`;
    };
    for (let i = 0; i < layout.boxes.length - 1; i++) {
      const a = layout.boxes[i];
      const b = layout.boxes[i + 1];
      const sy = a.y + a.h / 2;
      const ey = b.y + b.h / 2;
      pts.push({ d: cubic(a.x + a.w, sy, b.x, ey) });
    }
    return pts;
  }, [layout.boxes]);

  const trackWidth = layout.width - paddingX * 2;

  // ---- Internal autoplay if requested (forward only, restart at 0)
  const internalMV = useMotionValue(0);
  const [autoChecklist, setAutoChecklist] = useState(false);

  useEffect(() => {
    if (!loop || progressMV) return; // respect external control
    let cancelled = false;

    const run = async () => {
      setAutoChecklist(false);
      internalMV.set(0);
      // forward only — no reverse/mirror
      await animate(internalMV, 1, { duration: 4, ease: "linear" });
      setAutoChecklist(true);
      // dwell (set 0 for immediate restart)
      await new Promise((r) => setTimeout(r, Math.max(0, loopDwellMs)));
      if (!cancelled) run();
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [loop, progressMV, internalMV, loopDwellMs]);

  // choose which MotionValue drives the UI
  const hasActiveMV = !!progressMV || loop;
  const activeProgressMV = (progressMV ?? internalMV) as MotionValue<number>;

  // Spinner fades sooner and sits in a reserved pocket at end of HUD
  const spinnerAlpha = hasActiveMV
    ? (useTransform(activeProgressMV, (r) =>
        r < 0.92 ? 1 : Math.max(0, 1 - (r - 0.92) / 0.08)
      ) as any)
    : 1;

  // Active step glow that doesn't spill past the last box
  const clamp01 = (r: number) => Math.max(0, Math.min(1, r));
  const baseMV = hasActiveMV
    ? activeProgressMV
    : ({ get: () => clamp01(progressRatio) } as MotionValue<number>);
  const stepFloatMV = useTransform(baseMV, (r) => (steps.length - 1) * clamp01(r));

  const last = layout.boxes[layout.boxes.length - 1];
  const checklistDock = {
    x: last ? last.x + last.w + 24 : paddingX,
    y: last ? last.y : top,
  };
  const showChecklistNow = showChecklist || autoChecklist;

  return (
    <div className={className} style={{ height }}>
      <svg
        viewBox={`0 0 ${layout.width + 260} ${height}`} // extra room for checklist
        width="100%"
        height="100%"
        style={{ display: "block", background: "transparent" }}
        shapeRendering="geometricPrecision"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden={ariaHidden}
      >
        <defs>
          <linearGradient id={`${id}-line`} x1="0%" y1="0%" x2="100%">
            <stop offset="0%" stopColor="#f44336" />
            <stop offset="50%" stopColor="#ff9800" />
            <stop offset="100%" stopColor="#ffeb3b" />
          </linearGradient>
          <linearGradient id={`${id}-box`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
          </linearGradient>
        </defs>

        {/* HUD (progress + spinner) */}
        <g transform={`translate(${paddingX} ${18})`}>
          <text x={0} y={0} dy={12} fill="rgba(255,255,255,0.9)" fontSize={12}>
            Covering measure points
          </text>

          <motion.text
            key={pointsCovered}
            x={178}
            y={0}
            dy={12}
            fill="#fff"
            fontSize={12}
            initial={{ scale: 0.92, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.5 }}
          >
            {Math.max(0, Math.min(pointsTotal, Math.round(pointsCovered)))} / {pointsTotal}
          </motion.text>

          {/* track */}
          <rect x={0} y={20} width={trackWidth} height={8} rx={4} fill="rgba(255,255,255,0.10)" />

          {/* fill — from active MV if present, otherwise from static ratio */}
          <motion.rect
            x={0}
            y={20}
            height={8}
            rx={4}
            fill={`url(#${id}-line)`}
            animate={
              hasActiveMV ? undefined : { width: trackWidth * clamp01(progressRatio) }
            }
            style={
              hasActiveMV
                ? {
                    width: useTransform(
                      activeProgressMV,
                      (r: number) => trackWidth * clamp01(r)
                    ) as any,
                  }
                : undefined
            }
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
          />

          {/* spinner pocket (never overlaps text or bar) */}
          {spinner && !reduce && (
            // keep static translate/scale on a plain <g>, rotate inner motion.g
            <g transform={`translate(${trackWidth + 18} ${18}) scale(0.86)`}>
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
                style={{ transformOrigin: "6px 6px", opacity: spinnerAlpha }}
              >
                <circle
                  cx="6"
                  cy="6"
                  r="6"
                  fill="none"
                  stroke="rgba(255,255,255,0.28)"
                  strokeWidth="1.5"
                />
                <path
                  d="M6 0 A6 6 0 0 1 12 6"
                  fill="none"
                  stroke="#ffeb3b"
                  strokeWidth="2"
                />
              </motion.g>
            </g>
          )}
        </g>

        {/* connectors */}
        {connectors.map((c, i) => (
          <motion.path
            key={`conn-${i}`}
            d={c.d}
            stroke={`url(#${id}-line)`}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
            pointerEvents="none"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0.6 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.18 * i }}
          />
        ))}

        {/* step boxes */}
        {layout.boxes.map((b, i) => {
          const glow = useTransform(stepFloatMV, (f) => {
            const d = Math.abs(i - f);
            const k = Math.exp(-(d * d) / (2 * 0.55 * 0.55));
            const px = Math.max(0, 12 * k - 2);
            return px > 0 ? `drop-shadow(0 0 ${px}px rgba(255,235,59,0.25))` : "none";
          });
          const labelOpacity = useTransform(stepFloatMV, (f) => {
            const d = Math.abs(i - f);
            const k = Math.exp(-(d * d) / (2 * 0.55 * 0.55));
            return 0.7 + 0.3 * k;
          });

          return (
            <g key={`box-${b.key}`} transform={`translate(${b.x} ${b.y})`}>
              <motion.rect
                width={b.w}
                height={b.h}
                rx={radius}
                fill="rgba(255,255,255,0.02)"
                stroke="rgba(255,255,255,0.22)"
                vectorEffect="non-scaling-stroke"
                style={{ filter: glow as any }}
              />
              <rect
                width={b.w}
                height={b.h}
                rx={radius}
                fill={`url(#${id}-box)`}
                opacity={0.12}
                pointerEvents="none"
              />
              <motion.text
                x={b.w / 2}
                y={b.h / 2}
                dominantBaseline="middle"
                textAnchor="middle"
                fill="#fff"
                fontSize={12}
                style={{ opacity: labelOpacity as any }}
              >
                {b.label}
              </motion.text>
            </g>
          );
        })}

        {/* Checklist dock */}
        {showChecklistNow &&
          last &&
          (() => {
            const items = checklistItems.slice(0, 3);
            const panelPadding = 10;
            const itemHeight = 16;
            const panelWidth = 208;
            const panelHeight = panelPadding * 2 + items.length * itemHeight;

            // Preferred: to the right of last box
            const preferredX = checklistDock.x;
            const preferredY = last.y + (last.h - panelHeight) / 2;

            // Keep below HUD
            const minY = HUD_H + 8;
            let x = preferredX;
            let y = Math.max(minY, preferredY);

            // If it doesn't fit on the right, drop it below the row, left-aligned
            const viewRight = layout.width + 260;
            const fitsRight = x + panelWidth <= viewRight;
            if (!fitsRight) {
              x = paddingX;
              y = Math.max(minY, last.y + last.h + 12);
            }

            return (
              // static translate on <g>, motion for entrance only
              <g transform={`translate(${x} ${y})`}>
                <motion.g
                  key={`checklist-docked`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  pointerEvents="none"
                >
                  <rect
                    width={panelWidth}
                    height={panelHeight}
                    rx={10}
                    fill="rgba(0,0,0,0.55)"
                    stroke="rgba(255,255,255,0.22)"
                  />
                  {items.map((item, idx2) => (
                    <motion.g
                      key={`cli-${idx2}`}
                      transform={`translate(${panelPadding} ${
                        panelPadding + idx2 * itemHeight
                      })`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * idx2 }}
                    >
                      <motion.path
                        d="M2 7 L7 12 L15 3"
                        fill="none"
                        stroke="#8bc34a"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                          duration: 0.35,
                          ease: "easeOut",
                          delay: 0.08 * idx2,
                        }}
                      />
                      <motion.text
                        x={22}
                        y={2}
                        dominantBaseline="hanging"
                        fill="#e8f5e9"
                        fontSize={11}
                      >
                        {item}
                      </motion.text>
                    </motion.g>
                  ))}
                </motion.g>
              </g>
            );
          })()}
      </svg>
    </div>
  );
}
