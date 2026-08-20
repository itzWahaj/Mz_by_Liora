"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useAnimate, stagger } from "framer-motion";

// ─── Particle System ───────────────────────────────────────────────────────────
type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  speedX: number;
  speedY: number;
  life: number;
  maxLife: number;
};

const PARTICLE_COLORS = [
  "rgba(30,95,191,",
  "rgba(20,184,166,",
  "rgba(45,212,191,",
  "rgba(232,115,74,",
  "rgba(124,58,237,",
];

function useParticles(active: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const idRef = useRef(0);

  const spawn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    particlesRef.current.push({
      id: idRef.current++,
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]!,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: -(Math.random() * 1.2 + 0.4),
      life: 0,
      maxLife: Math.random() * 180 + 120,
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let lastSpawn = 0;
    const tick = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (time - lastSpawn > 40) {
        spawn();
        lastSpawn = time;
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life++;
        p.x += p.speedX;
        p.y += p.speedY;
        const progress = p.life / p.maxLife;
        const alpha = p.opacity * (1 - progress);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${alpha.toFixed(2)})`;
        ctx.fill();

        return p.life < p.maxLife;
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active, spawn]);

  return canvasRef;
}

// ─── Orb Component ────────────────────────────────────────────────────────────
function FloatingOrb({
  color,
  size,
  x,
  y,
  delay,
  duration,
}: {
  color: string;
  size: number;
  x: string;
  y: string;
  delay: number;
  duration: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: color,
        filter: "blur(80px)",
        transform: "translate(-50%, -50%)",
      }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{
        opacity: [0, 0.5, 0.3, 0.5, 0],
        scale: [0.3, 1.2, 1, 1.3, 0.8],
        x: [0, 30, -20, 10, 0],
        y: [0, -40, 20, -10, 0],
      }}
      transition={{
        delay,
        duration,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror",
      }}
    />
  );
}

// ─── Letter animation ─────────────────────────────────────────────────────────
const BRAND_NAME_1 = "MZ";
const BRAND_NAME_2 = "by LIORA";

// ─── Main Splash Component ────────────────────────────────────────────────────
interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export default function SplashScreen({
  onComplete,
  minDuration = 3200,
}: SplashScreenProps) {
  const [phase, setPhase] = useState<
    "loading" | "reveal" | "tagline" | "exit"
  >("loading");
  const [progress, setProgress] = useState(0);
  const [scope, animate] = useAnimate();
  const canvasRef = useParticles(phase !== "exit");
  const startRef = useRef(Date.now());

  // ── Progress bar simulation ──────────────────────────────────────────────
  useEffect(() => {
    const intervals: ReturnType<typeof setTimeout>[] = [];
    const steps = [
      { target: 30, delay: 0, speed: 20 },
      { target: 65, delay: 400, speed: 25 },
      { target: 85, delay: 900, speed: 35 },
      { target: 100, delay: 1600, speed: 15 },
    ];

    steps.forEach(({ target, delay, speed }) => {
      intervals.push(
        setTimeout(() => {
          const id = setInterval(() => {
            setProgress((p) => {
              if (p >= target) {
                clearInterval(id);
                return p;
              }
              return Math.min(p + 1, target);
            });
          }, speed);
          intervals.push(id as unknown as ReturnType<typeof setTimeout>);
        }, delay)
      );
    });

    return () => intervals.forEach(clearInterval);
  }, []);

  // ── Phase transitions ────────────────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 1800);
    const t2 = setTimeout(() => setPhase("tagline"), 2400);
    const t3 = setTimeout(() => setPhase("exit"), minDuration - 600);
    const t4 = setTimeout(() => onComplete(), minDuration);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [minDuration, onComplete]);

  // ── Letter stagger on reveal ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "reveal") return;
    animate(
      ".brand-letter",
      { opacity: [0, 1], y: [40, 0], filter: ["blur(8px)", "blur(0px)"] },
      { delay: stagger(0.06), duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    );
  }, [phase, animate]);

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#04080F" }}
        exit={{
          opacity: 0,
          scale: 1.04,
          filter: "blur(12px)",
        }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* Particle canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0.7 }}
        />

        {/* Floating orbs */}
        <FloatingOrb
          color="radial-gradient(circle, rgba(30,95,191,0.7), transparent)"
          size={520}
          x="15%"
          y="20%"
          delay={0}
          duration={7}
        />
        <FloatingOrb
          color="radial-gradient(circle, rgba(20,184,166,0.5), transparent)"
          size={400}
          x="75%"
          y="65%"
          delay={0.8}
          duration={9}
        />
        <FloatingOrb
          color="radial-gradient(circle, rgba(232,115,74,0.4), transparent)"
          size={350}
          x="80%"
          y="15%"
          delay={1.2}
          duration={8}
        />
        <FloatingOrb
          color="radial-gradient(circle, rgba(124,58,237,0.4), transparent)"
          size={300}
          x="20%"
          y="80%"
          delay={0.4}
          duration={10}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(20,184,166,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(20,184,166,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Radial vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(4,8,15,0.85) 100%)",
          }}
        />

        {/* Center content */}
        <div
          ref={scope}
          className="relative z-10 flex flex-col items-center gap-6 px-8"
        >
          {/* Logo mark — animated ring */}
          <motion.div
            className="relative mb-2"
            initial={{ scale: 0, rotate: -120 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            {/* Outer rotating ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, #1E5FBF, #14B8A6, #E8734A, #7C3AED, #1E5FBF)",
                padding: 2,
                borderRadius: "50%",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, ease: "linear", repeat: Infinity }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{ background: "#04080F" }}
              />
            </motion.div>

            {/* Inner glowing circle */}
            <motion.div
              className="relative flex items-center justify-center"
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)",
                border: "2px solid rgba(20,184,166,0.3)",
              }}
              animate={{
                boxShadow: [
                  "0 0 20px rgba(20,184,166,0.2), 0 0 40px rgba(30,95,191,0.1)",
                  "0 0 40px rgba(20,184,166,0.5), 0 0 80px rgba(30,95,191,0.3)",
                  "0 0 20px rgba(20,184,166,0.2), 0 0 40px rgba(30,95,191,0.1)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Monogram */}
              <span
                className="font-display font-bold text-white select-none"
                style={{ fontSize: 28, letterSpacing: "-0.03em" }}
              >
                ML
              </span>
            </motion.div>
          </motion.div>

          {/* Brand name letters */}
          <div className="flex flex-col items-center gap-1 select-none">
            {/* "MZ" */}
            <div className="flex gap-[0.06em] overflow-hidden">
              {BRAND_NAME_1.split("").map((ch, i) => (
                <span
                  key={i}
                  className="brand-letter font-display font-bold text-white"
                  style={{
                    fontSize: "clamp(52px, 9vw, 96px)",
                    letterSpacing: "0.2em",
                    opacity: 0,
                    lineHeight: 1,
                    textShadow:
                      "0 0 40px rgba(20,184,166,0.4), 0 2px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {ch}
                </span>
              ))}
            </div>

            {/* Separator line */}
            <motion.div
              className="my-1"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={
                phase === "reveal" || phase === "tagline" || phase === "exit"
                  ? { scaleX: 1, opacity: 1 }
                  : {}
              }
              transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: 1,
                width: "clamp(120px, 20vw, 220px)",
                background:
                  "linear-gradient(90deg, transparent, #14B8A6, #1E5FBF, transparent)",
                transformOrigin: "center",
              }}
            />

            {/* "by LIORA" */}
            <div className="flex gap-[0.05em] overflow-hidden items-baseline">
              {BRAND_NAME_2.split("").map((ch, i) => (
                <span
                  key={i}
                  className="brand-letter font-display text-white"
                  style={{
                    fontSize:
                      ch === " "
                        ? "clamp(12px, 2vw, 20px)"
                        : "clamp(28px, 5vw, 52px)",
                    letterSpacing: "0.35em",
                    opacity: 0,
                    fontWeight: ch === " " ? 300 : 400,
                    lineHeight: 1,
                    color:
                      i < 3
                        ? "rgba(255,255,255,0.55)"
                        : "rgba(255,255,255,0.95)",
                  }}
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>

          {/* Tagline */}
          <AnimatePresence>
            {(phase === "tagline" || phase === "exit") && (
              <motion.p
                key="tagline"
                className="font-sans text-center"
                style={{
                  fontSize: "clamp(11px, 1.5vw, 13px)",
                  letterSpacing: "0.35em",
                  color: "rgba(20,184,166,0.85)",
                  textTransform: "uppercase",
                }}
                initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                Care Beyond Standards
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Track */}
          <div
            className="w-full"
            style={{
              height: 2,
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {/* Fill */}
            <motion.div
              style={{
                height: "100%",
                width: `${progress}%`,
                background:
                  "linear-gradient(90deg, #1E5FBF 0%, #14B8A6 50%, #2DD4BF 100%)",
                boxShadow: "0 0 12px rgba(20,184,166,0.7)",
                transformOrigin: "left",
              }}
              transition={{ ease: "easeOut" }}
            />
          </div>

          {/* Percentage */}
          <motion.div
            className="flex justify-between items-center px-8 py-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <span
              className="font-sans"
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              mzbyliora.com
            </span>
            <span
              className="font-sans tabular-nums"
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                color: "rgba(20,184,166,0.6)",
              }}
            >
              {progress}%
            </span>
          </motion.div>
        </motion.div>

        {/* Scanline subtle texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
