'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

/**
 * Perspective grid with light beams racing along its walls — adapted from
 * Magic UI's warp-background. Two deliberate departures from the original:
 * it renders as a pure background layer (absolutely filling its parent,
 * no wrapper card or children), and the beams stay in the site's gold
 * band instead of random rainbow hues.
 *
 * Beams are generated after mount: their positions are random, and
 * randomness during server render would make React's hydration check fail.
 */

interface WarpBackgroundProps {
  className?: string;
  perspective?: number;
  beamsPerSide?: number;
  beamSize?: number;
  beamDelayMax?: number;
  beamDelayMin?: number;
  beamDuration?: number;
  gridColor?: string;
}

type BeamSpec = { x: number; delay: number; hue: number; aspectRatio: number };

const Beam = ({
  width,
  x,
  delay,
  duration,
  hue,
  aspectRatio,
}: {
  width: string;
  x: string;
  delay: number;
  duration: number;
  hue: number;
  aspectRatio: number;
}) => (
  <motion.div
    style={
      {
        '--x': x,
        '--width': width,
        '--aspect-ratio': `${aspectRatio}`,
        '--background': `linear-gradient(hsl(${hue} 85% 62% / 0.85), transparent)`,
      } as React.CSSProperties
    }
    className="absolute left-[var(--x)] top-0 [aspect-ratio:1/var(--aspect-ratio)] [background:var(--background)] [width:var(--width)]"
    initial={{ y: '100cqmax', x: '-50%' }}
    animate={{ y: '-100%', x: '-50%' }}
    transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
  />
);

export function WarpBackground({
  className,
  perspective = 100,
  beamsPerSide = 3,
  beamSize = 5,
  beamDelayMax = 3,
  beamDelayMin = 0,
  beamDuration = 3,
  gridColor = 'rgba(255, 255, 255, 0.06)',
}: WarpBackgroundProps) {
  const [sides, setSides] = React.useState<BeamSpec[][] | null>(null);

  React.useEffect(() => {
    const generate = (): BeamSpec[] => {
      const cellsPerSide = Math.floor(100 / beamSize);
      const step = cellsPerSide / beamsPerSide;
      return Array.from({ length: beamsPerSide }, (_, i) => ({
        x: Math.floor(i * step),
        delay: Math.random() * (beamDelayMax - beamDelayMin) + beamDelayMin,
        // The site's gold sits around hue 42; wander a little to each side.
        hue: 34 + Math.random() * 18,
        aspectRatio: Math.floor(Math.random() * 10) + 1,
      }));
    };
    setSides([generate(), generate(), generate(), generate()]);
  }, [beamsPerSide, beamSize, beamDelayMax, beamDelayMin]);

  const wallStyle =
    '[background-size:var(--beam-size)_var(--beam-size)] [background:linear-gradient(var(--grid-color)_0_1px,_transparent_1px_var(--beam-size))_50%_-0.5px_/var(--beam-size)_var(--beam-size),linear-gradient(90deg,_var(--grid-color)_0_1px,_transparent_1px_var(--beam-size))_50%_50%_/var(--beam-size)_var(--beam-size)] [container-type:inline-size] [transform-style:preserve-3d]';

  const renderBeams = (beams: BeamSpec[] | undefined, side: string) =>
    beams?.map((beam, index) => (
      <Beam
        key={`${side}-${index}`}
        width={`${beamSize}%`}
        x={`${beam.x * beamSize}%`}
        delay={beam.delay}
        duration={beamDuration}
        hue={beam.hue}
        aspectRatio={beam.aspectRatio}
      />
    ));

  return (
    <div
      aria-hidden="true"
      style={
        {
          '--perspective': `${perspective}px`,
          '--grid-color': gridColor,
          '--beam-size': `${beamSize}%`,
        } as React.CSSProperties
      }
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden [clip-path:inset(0)] [container-type:size] [perspective:var(--perspective)] [transform-style:preserve-3d]',
        className,
      )}
    >
      {/* top wall */}
      <div
        className={cn(
          'absolute [height:100cqmax] [transform-origin:50%_0%] [transform:rotateX(-90deg)] [width:100cqi]',
          wallStyle,
        )}
      >
        {renderBeams(sides?.[0], 'top')}
      </div>
      {/* bottom wall */}
      <div
        className={cn(
          'absolute top-full [height:100cqmax] [transform-origin:50%_0%] [transform:rotateX(-90deg)] [width:100cqi]',
          wallStyle,
        )}
      >
        {renderBeams(sides?.[1], 'bottom')}
      </div>
      {/* left wall */}
      <div
        className={cn(
          'absolute left-0 top-0 [height:100cqmax] [transform-origin:0%_0%] [transform:rotate(90deg)_rotateX(-90deg)] [width:100cqh]',
          wallStyle,
        )}
      >
        {renderBeams(sides?.[2], 'left')}
      </div>
      {/* right wall */}
      <div
        className={cn(
          'absolute right-0 top-0 [height:100cqmax] [transform-origin:100%_0%] [transform:rotate(-90deg)_rotateX(-90deg)] [width:100cqh]',
          wallStyle,
        )}
      >
        {renderBeams(sides?.[3], 'right')}
      </div>
    </div>
  );
}
