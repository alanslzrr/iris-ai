'use client';

import React from 'react';
import { motion, useReducedMotion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';

function FloatingPaths({ position }: { position: number }) {
	const prefersReducedMotion = useReducedMotion();

	const paths = React.useMemo(
		() =>
			Array.from({ length: 36 }, (_, i) => ({
				id: i,
				d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
					380 - i * 5 * position
				} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
					152 - i * 5 * position
				} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
					684 - i * 5 * position
				} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
				width: 0.5 + i * 0.03,
				opacity: 0.03 + i * 0.01,
			})),
		[position]
	);

	return (
		<div className="absolute inset-0 pointer-events-none" aria-hidden>
			<svg
				className="w-full h-full text-white"
				viewBox="0 0 696 316"
				fill="none"
				role="img"
				aria-label="Animated background paths"
			>
				{paths.map((p) => (
					<motion.path
						key={p.id}
						d={p.d}
						stroke="currentColor"
						strokeWidth={p.width}
						strokeOpacity={p.opacity}
						initial={
							prefersReducedMotion
								? { pathLength: 1, opacity: p.opacity }
								: { pathLength: 0.3, opacity: 0.6 }
						}
						animate={
							prefersReducedMotion
								? undefined
								: { pathLength: 1, opacity: [0.3, 0.6, 0.3], pathOffset: [0, 1, 0] }
						}
						transition={
							prefersReducedMotion
								? undefined
								: { duration: 20 + Math.random() * 10, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }
						}
					/>
				))}
			</svg>
		</div>
	);
}

export function HomeAnimatedPaths() {
	const prefersReducedMotion = useReducedMotion();
	const { scrollY } = useScroll();

	// Use viewport-sensitive thresholds so the stronger blur begins right below the HERO
	const [viewportHeight, setViewportHeight] = React.useState<number | null>(null);
	React.useEffect(() => {
		const update = () => setViewportHeight(window.innerHeight);
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);

	// Compute ranges once; keep hooks order stable
	const ranges = React.useMemo(() => {
		if (!viewportHeight) {
			return {
				yIn: [0, 400, 1200],
				yOut: [0, -80, -180],
				opIn: [0, 300, 900, 1600],
				opOut: [0.9, 0.75, 0.42, 0.2],
				blurIn: [0, 700, 1700],
				blurOut: [0, 2, 8],
			};
		}
		const heroEnd = Math.round(viewportHeight * 0.9); // matches min-h-[90svh]
		const heavyStart = heroEnd + 120; // stronger blur just below hero
		const heavyEnd = heavyStart + 700; // ramp region
		const far = heavyEnd + 1000;
		return {
			yIn: [0, heroEnd, heroEnd * 3],
			yOut: [0, -120, -300],
			opIn: [0, heroEnd, heavyEnd, far],
			opOut: [0.92, 0.7, 0.28, 0.18],
			blurIn: [0, heroEnd, heavyStart, heavyEnd, far],
			blurOut: [0, 1, 8, 12, 10],
		};
	}, [viewportHeight]);

	const y = useTransform(scrollY, ranges.yIn, ranges.yOut);
	const opacity = useTransform(scrollY, ranges.opIn, ranges.opOut);
	const blurPx = useTransform(scrollY, ranges.blurIn, ranges.blurOut);
	const filter = useMotionTemplate`blur(${blurPx}px)`;

	return (
		<div className="background-base pointer-events-none" aria-hidden>
			{prefersReducedMotion ? (
				<div className="absolute inset-0" style={{ opacity: 0.25 }}>
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>
			) : (
				<motion.div
					className="absolute inset-0"
					style={{ y, opacity, filter, willChange: 'transform, opacity, filter' }}
				>
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</motion.div>
			)}
		</div>
	);
}


