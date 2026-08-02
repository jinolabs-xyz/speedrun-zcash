'use client';

import { useEffect, useRef } from 'react';

/**
 * Spring-following ribbon trail that tracks the pointer across its parent.
 *
 * Each trail is a chain of nodes pulled toward the cursor with a slightly
 * different spring constant; drawing them additively at very low alpha builds
 * up a soft ribbon. Hue oscillates in a narrow band around the brand gold
 * rather than cycling the spectrum, so it reads as shimmer rather than
 * rainbow.
 */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const CONFIG = {
  trails: 60,
  nodesPerTrail: 42,
  friction: 0.5,
  dampening: 0.025,
  tension: 0.99,
  baseSpring: 0.45,
  lineWidth: 9,
  alpha: 0.025,
  /** Narrow band around gold (#f4b728 ≈ 43°). */
  hue: { center: 43, swing: 9, frequency: 0.0015 },
};

class Trail {
  private readonly nodes: Node[] = [];
  private readonly spring: number;
  private readonly friction: number;

  constructor(spring: number, x: number, y: number) {
    this.spring = spring + Math.random() * 0.1 - 0.05;
    this.friction = CONFIG.friction + Math.random() * 0.01 - 0.005;
    for (let i = 0; i < CONFIG.nodesPerTrail; i++) {
      this.nodes.push({ x, y, vx: 0, vy: 0 });
    }
  }

  update(targetX: number, targetY: number): void {
    let spring = this.spring;
    const head = this.nodes[0];
    head.vx += (targetX - head.x) * spring;
    head.vy += (targetY - head.y) * spring;

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (i > 0) {
        const previous = this.nodes[i - 1];
        node.vx += (previous.x - node.x) * spring;
        node.vy += (previous.y - node.y) * spring;
        node.vx += previous.vx * CONFIG.dampening;
        node.vy += previous.vy * CONFIG.dampening;
      }
      node.vx *= this.friction;
      node.vy *= this.friction;
      node.x += node.vx;
      node.y += node.vy;
      spring *= CONFIG.tension;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const [first] = this.nodes;
    let x = first.x;
    let y = first.y;

    ctx.beginPath();
    ctx.moveTo(x, y);

    let i = 1;
    for (; i < this.nodes.length - 2; i++) {
      const node = this.nodes[i];
      const next = this.nodes[i + 1];
      x = (node.x + next.x) * 0.5;
      y = (node.y + next.y) * 0.5;
      ctx.quadraticCurveTo(node.x, node.y, x, y);
    }

    const node = this.nodes[i];
    const next = this.nodes[i + 1];
    ctx.quadraticCurveTo(node.x, node.y, next.x, next.y);
    ctx.stroke();
    ctx.closePath();
  }
}

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    // The design system promises reduced motion is honoured; a cursor-chasing
    // ribbon is exactly what that setting is for.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let trails: Trail[] = [];
    let phase = Math.random() * Math.PI * 2;
    let running = true;
    let animation = 0;

    const pointer = { x: 0, y: 0 };
    let seeded = false;
    // The ribbon exists only inside the parent: outside it we stop drawing
    // entirely rather than letting the trail chase an unreachable cursor
    // along the edges.
    let inside = false;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      // A zero measurement happens if this fires before layout settles.
      // Writing it to the inline style would pin the canvas at 0 forever,
      // since inline styles outrank the w-full/h-full classes.
      if (rect.width === 0 || rect.height === 0) return;

      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      if (!seeded) {
        pointer.x = width / 2;
        pointer.y = height / 2;
      }
    };

    const seedTrails = () => {
      trails = Array.from(
        { length: CONFIG.trails },
        (_, i) =>
          new Trail(
            CONFIG.baseSpring + (i / CONFIG.trails) * 0.025,
            pointer.x,
            pointer.y,
          ),
      );
    };

    const track = (clientX: number, clientY: number) => {
      const rect = parent.getBoundingClientRect();
      inside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;
      if (!inside) return;

      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
      if (!seeded) {
        seeded = true;
        seedTrails();
      }
    };

    const onMouseMove = (event: MouseEvent) =>
      track(event.clientX, event.clientY);

    // Deliberately passive and without preventDefault: swallowing touchmove
    // here would stop the page scrolling on a phone.
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) track(touch.clientX, touch.clientY);
    };

    const render = () => {
      if (!running) return;

      // Self-heal if we mounted before layout had a size (a hidden tab, a
      // zero-width viewport). Costs a measurement only while unsized.
      if (!width || !height) {
        resize();
        if (!width || !height) {
          animation = window.requestAnimationFrame(render);
          return;
        }
        seedTrails();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);

      // Pointer is elsewhere on the page: stay blank until it returns.
      if (!inside) {
        animation = window.requestAnimationFrame(render);
        return;
      }

      ctx.globalCompositeOperation = 'lighter';

      phase += CONFIG.hue.frequency;
      const hue = CONFIG.hue.center + Math.sin(phase) * CONFIG.hue.swing;
      ctx.strokeStyle = `hsla(${hue.toFixed(1)}, 92%, 55%, ${CONFIG.alpha})`;
      ctx.lineWidth = CONFIG.lineWidth;

      for (const trail of trails) {
        trail.update(pointer.x, pointer.y);
        trail.draw(ctx);
      }

      animation = window.requestAnimationFrame(render);
    };

    const pause = () => {
      running = false;
      window.cancelAnimationFrame(animation);
    };

    const resume = () => {
      if (running) return;
      running = true;
      animation = window.requestAnimationFrame(render);
    };

    const onVisibility = () => (document.hidden ? pause() : resume());

    resize();
    seedTrails();
    animation = window.requestAnimationFrame(render);

    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('blur', pause);
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      pause();
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('blur', pause);
      window.removeEventListener('focus', resume);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
