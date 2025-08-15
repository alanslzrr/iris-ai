// src/components/home/illustrations/BatchOrchestrator.tsx
// This file contains the BatchOrchestrator component for the home page.
// It is used to display the batch orchestrator animation in the home page.
// The batch orchestrator animation is displayed in the home page.
// The batch orchestrator animation is displayed in the home page.

"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  className?: string;
  numCertificates?: number;
  showLabels?: boolean;
  showGrid?: boolean;
  stylePreset?: "neon" | "glass" | "minimal";
  laneLabels?: string[];
};

export default function BatchOrchestrator({
  className,
  numCertificates = 4,
  showLabels = true,
  showGrid = false,
  stylePreset = "minimal", // default to minimal for professionalism
  laneLabels = ["Requirements", "Tolerance", "CMC"],
}: Props) {
  const prefersReducedMotion = useReducedMotion();

  // keep brand accents on TOKENS only
  const ACCENT_A = "#ff9800";
  const ACCENT_B = "#ffeb3b";

  // layout
  const IN_X = 40;
  const ORCH = { x: 250, y: 88, w: 170, h: 68, r: 12, cx: 250 + 85, cy: 88 + 34 };
  const EVAL_X = 520;
  const LANES_Y = [64, 128, 192];
  const DB = { cx: 690, top: 208, rx: 46, ry: 12, height: 64 };

  // motion
  const tokenDuration = 6;
  const tokenTimes = [0, 0.2, 0.34, 0.58, 0.7, 0.9, 1];

  // style helpers
  const isNeon = stylePreset === "neon";
  const isGlass = stylePreset === "glass";

  // neutral strokes/fills for minimal; keep your gradient only when neon
  const STROKE = isNeon ? "url(#strokeGrad)" : "url(#strokeGraphite)";
  const FILL = isGlass
    ? "url(#glassFill)"
    : isNeon
    ? "url(#panelFill)"
    : "url(#surfaceFill)";

  // higher-contrast label color in minimal/glass (warmer, no blue cast)
  const LABEL = isNeon ? ACCENT_A : "#d4d4d8"; // zinc-300

  const certificates = Array.from({ length: numCertificates });

  const makeTokenAnim = (i: number) => {
    const startY = 64 + i * 26;
    const laneY = LANES_Y[i % LANES_Y.length];
    const orchEntryX = ORCH.x - 12;
    const evalEntryX = EVAL_X - 14;
    const dbEntryX = DB.cx - 8;

    if (prefersReducedMotion) {
      return {
        initial: { x: dbEntryX, y: laneY },
        animate: { x: dbEntryX, y: laneY },
        transition: { duration: 0 },
      };
    }

    return {
      initial: { x: IN_X, y: startY },
      animate: {
        x: [IN_X, orchEntryX, orchEntryX, evalEntryX, evalEntryX, dbEntryX, dbEntryX],
        y: [startY, startY, ORCH.cy, laneY, laneY, laneY, DB.top + DB.height - 18],
        scale: [1, 1, 1.03, 1, 1, 1, 1], // subtler pop
      },
      transition: {
        duration: tokenDuration,
        ease: "easeInOut",
        times: tokenTimes, // keyframe timings per docs
        delay: i * 0.55,
        repeat: Infinity,
      },
    };
  };

  return (
    <div className={className} aria-hidden>
      <motion.svg
        viewBox="0 0 780 300"
        width="100%"
        height="100%"
        role="img"
        style={{ display: "block" }}
        shapeRendering="geometricPrecision"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} // plays once on landing
      >
        <Defs ACCENT_A={ACCENT_A} ACCENT_B={ACCENT_B} neon={isNeon} glass={isGlass} />

        {showGrid && <Grid />}

        {/* Inputs stack */}
        {certificates.map((_, i) => {
          const y = 64 + i * 26;
          return (
            <NeatPanel
              key={`in-${i}`}
              x={IN_X - 2}
              y={y - 2}
              w={126}
              h={22}
              r={8}
              stroke={STROKE}
              fill={FILL}
              showGlow={isNeon}
              label={showLabels ? `Certificate ${i + 1}` : undefined}
              labelX={IN_X + 10}
              labelY={y + 12}
              accent={LABEL}
            />
          );
        })}

        {/* “+ more” hint */}
        <NeatPanel
          x={IN_X - 2}
          y={64 + numCertificates * 26 - 2}
          w={126}
          h={22}
          r={8}
          stroke={STROKE}
          fill="none"
          dashed
          label={showLabels ? "+ more" : undefined}
          labelX={IN_X + 61}
          labelY={64 + numCertificates * 26 + 12}
          accent={LABEL}
        />

        {/* Orchestrator */}
        <NeatPanel
          x={ORCH.x}
          y={ORCH.y}
          w={ORCH.w}
          h={ORCH.h}
          r={12}
          stroke={STROKE}
          fill={FILL}
          showGlow={isNeon}
          pulse={!prefersReducedMotion && isNeon} // no pulse in minimal
          label={showLabels ? "Orchestrator" : undefined}
          labelX={ORCH.x + ORCH.w / 2}
          labelY={ORCH.y + ORCH.h / 2 + 5}
          centerLabel
          accent={LABEL}
        />

        {/* Orchestrator gradient pulse border */}
        <motion.rect
          x={ORCH.x}
          y={ORCH.y}
          width={ORCH.w}
          height={ORCH.h}
          rx={12}
          fill="none"
          stroke="url(#strokeGrad)"
          strokeWidth={2}
          filter={isNeon ? "url(#glowSoft)" : undefined}
          style={{ pointerEvents: "none", transformOrigin: "50% 50%" }}
          initial={{ opacity: 0.9, scale: 1 }}
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: [0.95, 0.35, 0.95], scale: [1, 1.022, 1] }
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Lanes + Eval slots */}
        {LANES_Y.map((y, i) => (
          <g key={`lane-${i}`}>
            <line
              x1={ORCH.x + ORCH.w}
              y1={y}
              x2={EVAL_X + 110}
              y2={y}
              stroke={STROKE}
              strokeWidth="1.1"
              opacity={0.22}
            />
            <NeatPanel
              x={EVAL_X}
              y={y - 14}
              w={100}
              h={28}
              r={10}
              stroke={STROKE}
              fill={FILL}
              showGlow={isNeon}
              label={showLabels ? (laneLabels[i] ?? "Eval") : undefined}
              labelX={EVAL_X + 50}
              labelY={y + 4}
              centerLabel
              accent={LABEL}
            />
          </g>
        ))}

        {/* Reports DB (modern cylinder + badge) */}
        <CylinderDB
          cx={DB.cx}
          top={DB.top}
          rx={DB.rx}
          ry={DB.ry}
          height={DB.height}
          stroke={STROKE}
          fill={FILL}
          glow={isNeon}
          label={showLabels ? "Reports DB" : undefined}
          accent={LABEL}
        />

        {/* Tokens */}
        {certificates.map((_, i) => {
          const plan = makeTokenAnim(i);
          return (
            <g key={`token-${i}`}>
              {!prefersReducedMotion && (
                <motion.rect
                  width={18}
                  height={10}
                  rx={5}
                  fill="url(#tokenFill)"
                  stroke={STROKE}
                  strokeWidth="0.8"
                  opacity={0.35}
                  filter="url(#glowSoft)"
                  {...plan}
                  transition={{ ...plan.transition, delay: i * 0.55 + 0.1 }}
                />
              )}
              <motion.rect
                width={18}
                height={10}
                rx={5}
                fill="url(#tokenFill)"
                stroke={STROKE}
                strokeWidth="1"
                filter={isNeon ? "url(#glowSoft)" : isGlass ? "url(#dropSoft)" : undefined}
                {...plan}
              />
            </g>
          );
        })}
      </motion.svg>
    </div>
  );
}

function Defs({
  ACCENT_A,
  ACCENT_B,
  neon,
  glass,
}: {
  ACCENT_A: string;
  ACCENT_B: string;
  neon: boolean;
  glass: boolean;
}) {
  return (
    <defs>
      {/* Brand gradient used by neon/pulse */}
      <linearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={ACCENT_A} />
        <stop offset="65%" stopColor={ACCENT_B} />
      </linearGradient>

      {/* Warmer neutral stroke (no blue cast) */}
      <linearGradient id="strokeGraphite" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#a3a3a3" />
        <stop offset="100%" stopColor="#737373" />
      </linearGradient>

      {/* Neon panel wash (unchanged) */}
      <linearGradient id="panelFill" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={ACCENT_A} stopOpacity="0.07" />
        <stop offset="100%" stopColor={ACCENT_B} stopOpacity="0.05" />
      </linearGradient>

      {/* Subtle glass */}
      <linearGradient id="glassFill" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
      </linearGradient>

      {/* New dark surface (less blue than old #0b111b) */}
      <linearGradient id="surfaceFill" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#101113" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#101113" stopOpacity="0.65" />
      </linearGradient>

      {/* Token accent stays orange/yellow */}
      <linearGradient id="tokenFill" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={ACCENT_B} stopOpacity="0.35" />
        <stop offset="100%" stopColor={ACCENT_A} stopOpacity="0.25" />
      </linearGradient>

      {/* Cylinder shading + highlight */}
      <linearGradient id="cylShade" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0f1215" />
        <stop offset="50%" stopColor="#121417" />
        <stop offset="100%" stopColor="#0e1012" />
      </linearGradient>
      <radialGradient id="cylHighlight" cx="50%" cy="0%" r="85%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.10" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>

      {neon && (
        <>
          <filter id="glowSoft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glowStrong" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </>
      )}
      {glass && (
        <filter id="dropSoft" x="-40%" y="-40%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodOpacity="0.25" />
        </filter>
      )}
    </defs>
  );
}

function Grid() {
  const lines: ReactNode[] = [];
  for (let x = 0; x < 780; x += 40) {
    lines.push(<line key={`gx-${x}`} x1={x} y1={0} x2={x} y2={300} stroke="rgba(148,163,184,0.06)" />);
  }
  for (let y = 0; y < 300; y += 40) {
    lines.push(<line key={`gy-${y}`} x1={0} y1={y} x2={780} y2={y} stroke="rgba(148,163,184,0.06)" />);
  }
  return <g>{lines}</g>;
}

function NeatPanel({
  x,
  y,
  w,
  h,
  r,
  stroke,
  fill,
  dashed,
  showGlow,
  pulse,
  label,
  labelX,
  labelY,
  centerLabel,
  accent,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  stroke: string;
  fill: string;
  dashed?: boolean;
  showGlow?: boolean;
  pulse?: boolean;
  label?: string;
  labelX?: number;
  labelY?: number;
  centerLabel?: boolean;
  accent: string;
}) {
  const rectProps = { x, y, width: w, height: h, rx: r } as const;

  return (
    <g>
      {showGlow && (
        <rect {...rectProps} fill="none" stroke={stroke} strokeWidth={6} opacity={0.45} filter="url(#glowStrong)" />
      )}
      <motion.rect
        {...rectProps}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.4}
        strokeDasharray={dashed ? "4 6" : undefined}
        filter={showGlow ? "url(#glowSoft)" : undefined}
        initial={pulse ? { opacity: 1, scale: 1 } : { opacity: 1 }}
        animate={pulse ? { opacity: [1, 0.95, 1], scale: [1, 1.02, 1] } : { opacity: 1 }}
        transition={pulse ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : undefined}
      />
      {label && (
        <text
          x={labelX}
          y={labelY}
          textAnchor={centerLabel ? "middle" : "start"}
          fontSize={13}
          fontWeight={600}
          fill={accent}
          style={{ letterSpacing: 0.2, fontFamily: "Inter, ui-sans-serif, system-ui" }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** Modernized database cylinder with subtle highlight + tiny "Reports" badge */
function CylinderDB({
  cx,
  top,
  rx,
  ry,
  height,
  stroke,
  fill,
  glow,
  label,
  accent,
}: {
  cx: number;
  top: number;
  rx: number;
  ry: number;
  height: number;
  stroke: string;
  fill: string;
  glow?: boolean;
  label?: string;
  accent: string;
}) {
  const bottom = top + height;
  const commonFilter = glow ? "url(#glowSoft)" : undefined;

  return (
    <g>
      {/* Side body */}
      <rect
        x={cx - rx}
        y={top}
        width={rx * 2}
        height={height}
        rx={rx * 0.18}
        fill="url(#cylShade)"
        stroke={stroke}
        strokeWidth="1.4"
        filter={commonFilter}
      />
      {/* Top ellipse (fill + highlight) */}
      <ellipse cx={cx} cy={top} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth="1.2" filter={commonFilter} />
      <ellipse cx={cx} cy={top - 1} rx={rx * 0.84} ry={ry * 0.6} fill="url(#cylHighlight)" pointerEvents="none" />
      {/* Bottom ellipse (stroke only for clean edge) */}
      <ellipse cx={cx} cy={bottom} rx={rx} ry={ry} fill="none" stroke={stroke} strokeWidth="1" opacity={0.6} filter={commonFilter} />

      {/* Reports badge in the corner */}
      <ReportBadge x={cx + rx - 20} y={top + 6} stroke={stroke} />

      {label && (
        <text
          x={cx}
          y={bottom + 22}
          textAnchor="middle"
          fontSize={13}
          fontWeight={600}
          fill={accent}
          style={{ letterSpacing: 0.2, fontFamily: "Inter, ui-sans-serif, system-ui" }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

function ReportBadge({
  x,
  y,
  stroke,
}: {
  x: number;
  y: number;
  stroke: string;
}) {
  // a tiny doc with a folded corner + two report lines
  return (
    <g opacity={0.9} transform={`translate(${x}, ${y})`}>
      <rect x={0} y={0} width={16} height={18} rx={3} fill="#121418" stroke={stroke} strokeWidth="1" />
      <path d="M11 0 L16 5 L11 5 Z" fill="#1b1f24" />
      <line x1={4} y1={7} x2={12} y2={7} stroke="url(#strokeGraphite)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1={4} y1={11} x2={10} y2={11} stroke="url(#strokeGraphite)" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}
