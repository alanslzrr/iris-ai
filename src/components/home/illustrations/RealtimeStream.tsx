"use client";
import { motion, useReducedMotion } from 'framer-motion';

type Props = { className?: string };

export default function RealtimeStream({ className }: Props) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className={className} aria-hidden>
      <svg viewBox="0 0 520 360" width="100%" height="100%" role="img" style={{ display: 'block', background: 'transparent' }} shapeRendering="geometricPrecision">
        <defs>
          <linearGradient id="stream" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f44336" />
            <stop offset="50%" stopColor="#ff9800" />
            <stop offset="100%" stopColor="#ffeb3b" />
          </linearGradient>
          <linearGradient id="streamFill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f44336" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ff9800" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        {/* Nodes */}
        {[{x:120,y:180},{x:200,y:120},{x:320,y:200},{x:420,y:140}].map((n,i)=> (
          <motion.circle key={i} cx={n.x} cy={n.y} r={3} fill="#ffffff" initial={{ opacity: 0 }} animate={{ opacity: [0,0.85,0] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.35 }} />
        ))}
        {/* Moving stroke along path */}
        <motion.path
          d="M 120 180 C 160 140, 240 160, 200 120 S 320 200, 420 140"
          stroke="url(#stream)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
        />
        {/* Faint ribbon under the stream for depth */}
        <path d="M 120 182 C 160 142, 240 162, 200 122 S 320 202, 420 142" fill="none" stroke="url(#streamFill)" strokeWidth="6" opacity="0.08" />
      </svg>
    </div>
  );
}


