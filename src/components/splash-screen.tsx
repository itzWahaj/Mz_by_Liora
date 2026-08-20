"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

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

// (letter-by-letter animation removed — logo image is used instead)

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
  const canvasRef = useParticles(phase !== "exit");

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
        <div className="relative z-10 flex flex-col items-center gap-6 px-8">
          {/* ── Brand Logo ─────────────────────────────────────────────── */}
          <motion.div
            className="relative flex items-center justify-center"
          >
            {/* ── Deep glow pool that lives behind the logo ── */}
            <motion.div
              className="absolute pointer-events-none"
              style={{
                width: "90%",
                height: "60%",
                bottom: "-5%",
                left: "5%",
                background:
                  "radial-gradient(ellipse, rgba(20,184,166,0.5) 0%, rgba(30,95,191,0.3) 40%, transparent 70%)",
                filter: "blur(32px)",
                borderRadius: "50%",
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
                scaleX: [1, 1.12, 1],
                scaleY: [1, 1.06, 1],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* ── Coral accent glow (top-right) ── */}
            <motion.div
              className="absolute pointer-events-none"
              style={{
                width: "40%",
                height: "40%",
                top: "5%",
                right: "5%",
                background:
                  "radial-gradient(circle, rgba(232,115,74,0.35) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.15, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            />

            {/* ── Teal accent glow (bottom-left) ── */}
            <motion.div
              className="absolute pointer-events-none"
              style={{
                width: "35%",
                height: "35%",
                bottom: "10%",
                left: "8%",
                background:
                  "radial-gradient(circle, rgba(45,212,191,0.4) 0%, transparent 70%)",
                filter: "blur(18px)",
              }}
              animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
            />

            {/* ── The transparent logo itself ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.65, y: 30, filter: "blur(12px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              {/* Continuous slow float */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Colour-shifting drop shadow */}
                <motion.div
                  animate={{
                    filter: [
                      "drop-shadow(0 0 18px rgba(20,184,166,0.7)) drop-shadow(0 0 40px rgba(30,95,191,0.4))",
                      "drop-shadow(0 0 28px rgba(45,212,191,0.9)) drop-shadow(0 0 60px rgba(20,184,166,0.5))",
                      "drop-shadow(0 0 18px rgba(232,115,74,0.6)) drop-shadow(0 0 40px rgba(124,58,237,0.3))",
                      "drop-shadow(0 0 18px rgba(20,184,166,0.7)) drop-shadow(0 0 40px rgba(30,95,191,0.4))",
                    ],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image
                    src="/logo_transparent.png"
                    alt="MZ by LIORA"
                    width={1254}
                    height={836}
                    priority
                    draggable={false}
                    style={{
                      width: "clamp(280px, 40vw, 460px)",
                      height: "auto",
                      userSelect: "none",
                    }}
                  />
                </motion.div>

                {/* ── Shimmer sweep across the logo ── */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ borderRadius: 8 }}
                >
                  <motion.div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      width: "25%",
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
                      transform: "skewX(-15deg)",
                    }}
                    initial={{ left: "-30%" }}
                    animate={{ left: "120%" }}
                    transition={{
                      delay: 1.4,
                      duration: 0.9,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 4,
                    }}
                  />
                </div>

                {/* ── Sparkle on the 4-pointed star in the logo ── */}
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    top: "6%",
                    right: "30%",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "rgba(255,200,150,0.95)",
                    boxShadow: "0 0 8px 4px rgba(232,115,74,0.8)",
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.4, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 2.5,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>

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
