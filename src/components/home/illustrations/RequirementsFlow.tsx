// src/components/home/illustrations/RequirementsFlow.tsx
// This file contains the RequirementsFlow component for the home page.
// It is used to display the requirements flow animation in the home page.
// The requirements flow animation is displayed in the home page.
// The requirements flow animation is displayed in the home page.

"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { motion, Variants, useReducedMotion } from "framer-motion";

/** Optional props for container usage */
type Props = { className?: string };

/* ------------------------------------------------------------
   PATH UTILITIES
   ------------------------------------------------------------ */

/** Measure a path on the client — used only as a mount gate to avoid SSR mismatches */
function usePathReady(d: string) {
  const ref = useRef<SVGPathElement | null>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (!ref.current) return;
    // Touch layout measurement to guarantee we’re on the client before animating.
    // We don’t actually need the numerical length when using normalized pathLength.
    try {
      // Safari can throw if path is invalid — keep it safe.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = ref.current.getTotalLength();
    } catch {
      // ignore
    } finally {
      setReady(true);
    }
  }, [d]);

  return { ref, ready };
}

/** Smooth cubic Bézier from (sx,sy) to (tx,ty) */
function connectorPath(sx: number, sy: number, tx: number, ty: number) {
  const dx = tx - sx;
  const dy = ty - sy;
  const cx1 = sx + dx * 0.5;
  const cy1 = sy + dy * 0.2;
  const cx2 = tx - dx * 0.5;
  const cy2 = ty - dy * 0.8;
  return `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;
}

/** snap to 0.5 for crisp strokes (mostly helps straight edges) */
const snap05 = (v: number) => Math.round(v) + 0.5;

/* ------------------------------------------------------------
   CONNECTOR
   - Base stroke draws with normalized pathLength 0 -> 1 (bulletproof)
   - Optional “flowing packet” rides along the line (also normalized)
   ------------------------------------------------------------ */
function Connector({
  d,
  delay = 0,
  color = "url(#flow)",
  width = 1.6,
  flowWidth = 2.2,
  flowRatio = 0.12, // 0..1 fraction of the path used for the packet
  flowDuration = 2.2,
  drawDuration = 0.9,
}: {
  d: string;
  delay?: number;
  color?: string;
  width?: number;
  flowWidth?: number;
  flowRatio?: number; // normalized
  flowDuration?: number;
  drawDuration?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const { ref, ready } = usePathReady(d);

  // On first client paint, render an invisible path — then swap to animated paths.
  if (!ready) {
    return <path ref={ref} d={d} stroke="transparent" fill="none" />;
  }

  // Clamp “packet” to sane bounds
  const packet = Math.max(0.02, Math.min(0.5, flowRatio));
  const packetCycle = 1 + 1e-6; // tiny nudge to avoid seam in some browsers

  return (
    <>
      {/* Base line that draws exactly to the end (no dash rounding issues) */}
      <motion.path
        d={d}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="butt"           // crisp stop at the card edge
        strokeLinejoin="round"
        fill="none"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: drawDuration,
          delay,
          ease: [0.17, 0.67, 0.83, 0.67],
        }}
        pointerEvents="none"
      />

      {/* Subtle flowing packet (disabled for Reduced Motion) */}
      {!prefersReducedMotion && (
        <motion.path
          d={d}
          stroke={color}
          strokeWidth={flowWidth}
          strokeLinecap="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
          // This normalizes dash units to 0..1, so `${packet} ${1-packet}` is proportional.
          pathLength={1}
          initial={false}
          animate={{
            strokeDasharray: `${packet} ${1 - packet}`,
            strokeDashoffset: [0, -packetCycle],
          }}
          transition={{ duration: flowDuration, repeat: Infinity, ease: "linear" }}
          pointerEvents="none"
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------
   MAIN DIAGRAM
   ------------------------------------------------------------ */
export default function RequirementsFlow({ className }: Props) {
  const prefersReducedMotion = useReducedMotion();

  // Layout
  const frame = { top: 36, boxW: 132, boxH: 56 };
  const pdf = { x: 90, y: frame.top, w: frame.boxW, h: frame.boxH };
  const json = { x: 300, y: frame.top, w: frame.boxW, h: frame.boxH };
  const rowY = 170;

  const groups = [
    { label: "General", cx: 140 },
    { label: "Client", cx: 240 },
    { label: "Procedure", cx: 340 },
    { label: "Equipment", cx: 440 },
  ];

  const mapRowY = 260;
  const evalRowY = 340;
  const mapBox = { cx: 280, y: mapRowY - 18, w: 200, h: 36 };
  const evalBox = { cx: 280, y: evalRowY - 18, w: 200, h: 36 };

  // Orchestration
  const container: Variants = {
    hidden: { opacity: 1 }, // keep opacity stable; we’re staggering children only
    visible: {
      opacity: 1,
      transition: { when: "beforeChildren", staggerChildren: 0.12 },
    },
  };

  const stepPop: Variants = {
    hidden: { opacity: 0, scale: 0.98, filter: "blur(0px)" },
    visible: (delay: number) => ({
      opacity: 1,
      scale: 1,
      transition: { delay, duration: 0.25, ease: "easeOut" },
    }),
  };

  return (
    <div className={className} aria-hidden style={{ minHeight: 300 }}>
      <svg
        viewBox="0 0 560 400"
        width="100%"
        height="100%"
        role="img"
        aria-label="Requirements workflow"
        style={{ display: "block", background: "transparent" }}
        shapeRendering="geometricPrecision"
      >
			<defs>
				<linearGradient id="flow" x1="0" y1="0" x2="560" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f44336" />
            <stop offset="50%" stopColor="#ff9800" />
            <stop offset="100%" stopColor="#ffeb3b" />
          </linearGradient>

          {/* soft blur for fills */}
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --------------------------------------------------------
             LAYER 1: FILLS (under connectors)
             -------------------------------------------------------- */}
        <motion.g initial="hidden" animate="visible" variants={container}>
          {/* PDF fill */}
          <motion.rect
            custom={0.05}
            variants={stepPop}
            x={pdf.x}
            y={pdf.y}
            width={pdf.w}
            height={pdf.h}
            rx="10"
            fill="rgba(255,255,255,0.02)"
            filter="url(#soft)"
          />
          {/* JSON fill */}
          <motion.rect
            custom={0.1}
            variants={stepPop}
            x={json.x}
            y={json.y}
            width={json.w}
            height={json.h}
            rx="10"
            fill="rgba(255,255,255,0.02)"
            filter="url(#soft)"
          />

          {/* Group fills (no blur to keep them crisp) */}
          {groups.map((g, idx) => (
            <motion.rect
              key={`fill-${g.label}`}
              custom={0.2 + idx * 0.05}
              variants={stepPop}
              x={g.cx - 70}
              y={rowY - 18}
              width="140"
              height="36"
              rx="10"
              fill="rgba(255,255,255,0.02)"
            />
          ))}

          {/* Mapping fill */}
          <motion.rect
            custom={0.95}
            variants={stepPop}
            x={mapBox.cx - mapBox.w / 2}
            y={mapBox.y}
            width={mapBox.w}
            height={mapBox.h}
            rx="10"
            fill="rgba(255,255,255,0.02)"
            filter="url(#soft)"
          />

          {/* Evaluation fill */}
          <motion.rect
            custom={1.25}
            variants={stepPop}
            x={evalBox.cx - evalBox.w / 2}
            y={evalBox.y}
            width={evalBox.w}
            height={evalBox.h}
            rx="10"
            fill="rgba(255,255,255,0.02)"
            filter="url(#soft)"
          />
        </motion.g>

        {/* --------------------------------------------------------
             LAYER 2: CONNECTORS (between fill and outline)
             -------------------------------------------------------- */}
        <motion.g initial="hidden" animate="visible" variants={container}>
          {/* PDF → JSON (horizontal) */}
          <Connector
            d={`M ${snap05(pdf.x + pdf.w)} ${snap05(pdf.y + pdf.h / 2)} H ${snap05(
              json.x
            )}`}
            delay={0.1}
          />

          {/* JSON → Groups */}
          {groups.map((g, i) => {
            const sx = json.x + json.w / 2;
            const sy = json.y + json.h;
            const tx = g.cx;
            const ty = rowY - 18; // end exactly at top border
            const d = connectorPath(sx, sy, tx, ty);
            return <Connector key={`json-${g.label}`} d={d} delay={0.25 + i * 0.12} />;
          })}

          {/* Groups → Mapping */}
          {groups.map((g, i) => {
            const sx = g.cx;
            const sy = rowY + 18;
            const tx = mapBox.cx;
            const ty = mapRowY - 18;
            const d = connectorPath(sx, sy, tx, ty);
            return <Connector key={`grp-map-${g.label}`} d={d} delay={0.75 + i * 0.12} />;
          })}

          {/* Mapping → Evaluation (end exactly on Evaluation's top edge — no tuck) */}
			<Connector
				key="map-eval"
				d={connectorPath(mapBox.cx, mapRowY + 18, evalBox.cx, evalRowY - 18)}
				delay={1.2}
			/>
        </motion.g>

        {/* --------------------------------------------------------
             LAYER 3: OUTLINES + LABELS (top-most)
             -------------------------------------------------------- */}
        <motion.g initial="hidden" animate="visible" variants={container}>
          {/* PDF outline + label */}
          <motion.g custom={0.05} variants={stepPop}>
            <rect
              x={pdf.x}
              y={pdf.y}
              width={pdf.w}
              height={pdf.h}
              rx="10"
              fill="none"
              stroke="url(#flow)"
              strokeWidth="1.4"
              pointerEvents="none"
            />
            <g fill="#fff" fontSize="12" pointerEvents="none">
              <text x={pdf.x + 12} y={pdf.y + 18} fontSize="10" opacity="0.75">
                1
              </text>
              <text
                x={pdf.x + pdf.w / 2}
                y={pdf.y + pdf.h / 2 + 4}
                textAnchor="middle"
              >
                PDF
              </text>
            </g>
          </motion.g>

          {/* JSON outline + label */}
          <motion.g custom={0.1} variants={stepPop}>
            <rect
              x={json.x}
              y={json.y}
              width={json.w}
              height={json.h}
              rx="10"
              fill="none"
              stroke="url(#flow)"
              strokeWidth="1.4"
              pointerEvents="none"
            />
            <g fill="#fff" fontSize="12" pointerEvents="none">
              <text x={json.x + 12} y={json.y + 18} fontSize="10" opacity="0.75">
                2
              </text>
              <text
                x={json.x + json.w / 2}
                y={json.y + json.h / 2 + 4}
                textAnchor="middle"
              >
                JSON
              </text>
            </g>
          </motion.g>

          {/* Group outlines + labels */}
          {groups.map((g, idx) => (
            <motion.g key={`outline-${g.label}`} custom={0.2 + idx * 0.05} variants={stepPop}>
              <rect
                x={g.cx - 70}
                y={rowY - 18}
                width="140"
                height="36"
                rx="10"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                pointerEvents="none"
              />
              <text
                x={g.cx}
                y={rowY + 4}
                textAnchor="middle"
                fill="#fff"
                fontSize="11"
                pointerEvents="none"
              >
                {g.label}
              </text>
            </motion.g>
          ))}

          {/* Mapping outline + label */}
          <motion.g custom={0.95} variants={stepPop}>
            <rect
              x={mapBox.cx - mapBox.w / 2}
              y={mapBox.y}
              width={mapBox.w}
              height={mapBox.h}
              rx="10"
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              pointerEvents="none"
            />
            <text
              x={mapBox.cx}
              y={mapRowY + 4}
              textAnchor="middle"
              fill="#fff"
              fontSize="11"
              pointerEvents="none"
            >
              3 · Requirements Mapping
            </text>
          </motion.g>

          {/* Evaluation outline + label */}
          <motion.g custom={1.25} variants={stepPop}>
            <rect
              x={evalBox.cx - evalBox.w / 2}
              y={evalBox.y}
              width={evalBox.w}
              height={evalBox.h}
              rx="10"
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              pointerEvents="none"
            />
            <text
              x={evalBox.cx}
              y={evalRowY + 4}
              textAnchor="middle"
              fill="#fff"
              fontSize="11"
              pointerEvents="none"
            >
              4 · Evaluation
            </text>
          </motion.g>
        </motion.g>
      </svg>
    </div>
  );
}
