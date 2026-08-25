"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useTheme } from "@/components/providers/theme-provider";

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

const PARTICLE_COLORS_DARK = [
  "rgba(30,95,191,",
  "rgba(20,184,166,",
  "rgba(45,212,191,",
  "rgba(232,115,74,",
  "rgba(124,58,237,",
];

const PARTICLE_COLORS_LIGHT = [
  "rgba(20,184,166,",
  "rgba(30,95,191,",
  "rgba(14,165,233,",
  "rgba(232,115,74,",
];

function useParticles(active: boolean, isDark: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const idRef = useRef(0);

  const colors = isDark ? PARTICLE_COLORS_DARK : PARTICLE_COLORS_LIGHT;

  const spawn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    particlesRef.current.push({
      id: idRef.current++,
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      size: Math.random() * 2.5 + 1,
      opacity: isDark ? Math.random() * 0.5 + 0.2 : Math.random() * 0.4 + 0.15,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: -(Math.random() * 1.0 + 0.4),
      life: 0,
      maxLife: Math.random() * 120 + 80,
    });
  }, [colors, isDark]);

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

      if (time - lastSpawn > 60) {
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
        filter: "blur(70px)",
        transform: "translate(-50%, -50%)",
      }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: [0, 0.6, 0.4, 0.6, 0],
        scale: [0.6, 1.1, 0.9, 1.1, 0.7],
        x: [0, 20, -15, 10, 0],
        y: [0, -25, 15, -10, 0],
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

// ─── Main Splash Component ────────────────────────────────────────────────────
interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export default function SplashScreen({
  onComplete,
  minDuration = 1400,
}: SplashScreenProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [phase, setPhase] = useState<"loading" | "reveal" | "tagline" | "exit">("loading");
  const canvasRef = useParticles(phase !== "exit", isDark);

  // ── Snappy Phase transitions (no polling setInterval) ───────────────────
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 150);
    const t2 = setTimeout(() => setPhase("tagline"), 400);
    const t3 = setTimeout(() => setPhase("exit"), minDuration - 350);
    const t4 = setTimeout(() => onComplete(), minDuration);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [minDuration, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: isDark
            ? "#04080F"
            : "radial-gradient(ellipse 80% 80% at 50% 40%, #FFFFFF 0%, #F5F8F8 60%, #E8F0F2 100%)",
        }}
        exit={{
          opacity: 0,
          scale: 1.02,
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Particle canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: isDark ? 0.6 : 0.45 }}
        />

        {/* Ambient floating orbs with theme adaptation */}
        <FloatingOrb
          color={
            isDark
              ? "radial-gradient(circle, rgba(30,95,191,0.5), transparent)"
              : "radial-gradient(circle, rgba(20,184,166,0.18), transparent)"
          }
          size={460}
          x="18%"
          y="25%"
          delay={0}
          duration={6}
        />
        <FloatingOrb
          color={
            isDark
              ? "radial-gradient(circle, rgba(20,184,166,0.45), transparent)"
              : "radial-gradient(circle, rgba(30,95,191,0.14), transparent)"
          }
          size={380}
          x="78%"
          y="65%"
          delay={0.4}
          duration={7}
        />
        <FloatingOrb
          color={
            isDark
              ? "radial-gradient(circle, rgba(232,115,74,0.3), transparent)"
              : "radial-gradient(circle, rgba(232,115,74,0.12), transparent)"
          }
          size={300}
          x="75%"
          y="20%"
          delay={0.8}
          duration={6.5}
        />

        {/* Delicate grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: isDark
              ? `
                linear-gradient(rgba(20,184,166,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(20,184,166,0.04) 1px, transparent 1px)
              `
              : `
                linear-gradient(rgba(20,184,166,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(20,184,166,0.03) 1px, transparent 1px)
              `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Radial vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(4,8,15,0.85) 100%)"
              : "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(230,238,240,0.6) 100%)",
          }}
        />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center gap-5 px-8">
          {/* Brand Logo */}
          <motion.div className="relative flex items-center justify-center">
            {/* Deep glow pool behind logo */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: "90%",
                height: "60%",
                bottom: "-5%",
                left: "5%",
                background: isDark
                  ? "radial-gradient(ellipse, rgba(20,184,166,0.5) 0%, rgba(30,95,191,0.3) 40%, transparent 70%)"
                  : "radial-gradient(ellipse, rgba(20,184,166,0.25) 0%, rgba(30,95,191,0.12) 50%, transparent 70%)",
                filter: "blur(28px)",
                borderRadius: "50%",
              }}
            />

            {/* Logo Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                style={{
                  filter: isDark
                    ? "drop-shadow(0 0 24px rgba(216,187,122,0.6)) drop-shadow(0 0 50px rgba(89,101,34,0.35))"
                    : "drop-shadow(0 10px 25px rgba(48,53,21,0.08)) drop-shadow(0 0 15px rgba(196,154,69,0.25))",
                }}
              >
                <Image
                  src="/logo_transparent.png"
                  alt="MZ by LIORA"
                  width={1254}
                  height={836}
                  priority
                  draggable={false}
                  style={{
                    width: "clamp(260px, 36vw, 420px)",
                    height: "auto",
                    userSelect: "none",
                  }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Tagline */}
          <AnimatePresence>
            {(phase === "tagline" || phase === "exit") && (
              <motion.p
                key="tagline"
                className="font-display font-medium text-center"
                style={{
                  fontSize: "clamp(12px, 1.6vw, 14px)",
                  letterSpacing: "0.32em",
                  color: isDark ? "rgba(45,212,191,0.95)" : "#0F3D8C",
                  textTransform: "uppercase",
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                Care Beyond Standards
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Fast, continuous progress bar (0% to 100% in 1.1s smoothly via CSS/motion) */}
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          {/* Track */}
          <div
            className="w-full"
            style={{
              height: 2.5,
              background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            }}
          >
            {/* Fill */}
            <motion.div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #1E5FBF 0%, #14B8A6 60%, #2DD4BF 100%)",
                boxShadow: isDark
                  ? "0 0 12px rgba(20,184,166,0.7)"
                  : "0 0 8px rgba(20,184,166,0.4)",
                transformOrigin: "left",
              }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          {/* Footer Branding */}
          <div className="flex justify-between items-center px-8 py-3.5">
            <span
              className="font-sans font-medium"
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                color: isDark ? "rgba(255,255,255,0.35)" : "rgba(15,23,42,0.4)",
              }}
            >
              mzbyliora.com
            </span>
            <span
              className="font-sans font-semibold"
              style={{
                fontSize: 10,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: isDark ? "rgba(45,212,191,0.8)" : "rgba(20,184,166,0.9)",
              }}
            >
              Botanical Rituals
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
