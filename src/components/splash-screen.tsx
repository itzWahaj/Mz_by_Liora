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
  "rgba(216,187,122,", // Champagne Gold
  "rgba(196,154,69,",  // Antique Gold
  "rgba(89,101,34,",   // Olive Green
  "rgba(250,249,244,", // Warm Ivory
];

const PARTICLE_COLORS_LIGHT = [
  "rgba(216,187,122,", // Champagne Gold
  "rgba(196,154,69,",  // Antique Gold
  "rgba(89,101,34,",   // Olive Green
  "rgba(77,88,30,",    // Deep Olive
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
  minDuration = 2500,
}: SplashScreenProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [phase, setPhase] = useState<"loading" | "reveal" | "tagline" | "exit">("loading");
  const canvasRef = useParticles(phase !== "exit", isDark);

  // Preload logo image immediately
  useEffect(() => {
    if (typeof window !== "undefined") {
      const img = new window.Image();
      img.src = "/logo_3.png";
    }
  }, []);

  // Snappy yet smooth luxury phase transitions
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 80);
    const t2 = setTimeout(() => setPhase("tagline"), 450);
    const t3 = setTimeout(() => setPhase("exit"), minDuration - 450);
    const t4 = setTimeout(() => onComplete(), minDuration);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [minDuration, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 80% 80% at 50% 40%, #1A1F0D 0%, #111408 60%, #0A0C05 100%)"
            : "radial-gradient(ellipse 80% 80% at 50% 40%, #FFFDF8 0%, #FAF9F4 60%, #F3EFE6 100%)",
        }}
        exit={{
          opacity: 0,
          scale: 1.02,
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Particle canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: isDark ? 0.6 : 0.45 }}
        />

        {/* Ambient floating orbs with olive and champagne gold colors */}
        <FloatingOrb
          color={
            isDark
              ? "radial-gradient(circle, rgba(216,187,122,0.4), transparent)"
              : "radial-gradient(circle, rgba(216,187,122,0.3), transparent)"
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
              ? "radial-gradient(circle, rgba(89,101,34,0.45), transparent)"
              : "radial-gradient(circle, rgba(89,101,34,0.2), transparent)"
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
              ? "radial-gradient(circle, rgba(196,154,69,0.3), transparent)"
              : "radial-gradient(circle, rgba(196,154,69,0.18), transparent)"
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
                linear-gradient(rgba(216,187,122,0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(216,187,122,0.04) 1px, transparent 1px)
              `
              : `
                linear-gradient(rgba(216,187,122,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(216,187,122,0.06) 1px, transparent 1px)
              `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Radial vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(10,12,5,0.85) 100%)"
              : "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(240,235,225,0.6) 100%)",
          }}
        />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center gap-5 px-6 sm:px-8">
          {/* Brand Logo Container */}
          <motion.div className="relative flex items-center justify-center">
            {/* Deep ambient glow behind logo */}
            <motion.div
              className="absolute pointer-events-none"
              style={{
                width: "110%",
                height: "90%",
                background: isDark
                  ? "radial-gradient(ellipse, rgba(216,187,122,0.45) 0%, rgba(89,101,34,0.3) 45%, transparent 70%)"
                  : "radial-gradient(ellipse, rgba(216,187,122,0.35) 0%, rgba(89,101,34,0.18) 50%, transparent 70%)",
                filter: "blur(32px)",
                borderRadius: "50%",
              }}
              animate={{
                scale: [0.95, 1.08, 0.95],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Logo Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                style={{
                  filter: isDark
                    ? "drop-shadow(0 0 24px rgba(216,187,122,0.6)) drop-shadow(0 0 50px rgba(89,101,34,0.35))"
                    : "drop-shadow(0 10px 25px rgba(48,53,21,0.08)) drop-shadow(0 0 15px rgba(196,154,69,0.25))",
                }}
              >
                <Image
                  src="/logo_3.png"
                  alt="MZ by LIORA"
                  width={925}
                  height={899}
                  priority
                  unoptimized
                  draggable={false}
                  className="w-[240px] sm:w-[320px] md:w-[380px] lg:w-[420px] h-auto select-none"
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
                  fontSize: "clamp(12px, 1.6vw, 15px)",
                  letterSpacing: "0.32em",
                  color: isDark ? "#D8BB7A" : "#4D581E",
                  textTransform: "uppercase",
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                Care Beyond Standards
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Smooth continuous progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {/* Track */}
          <div
            className="w-full"
            style={{
              height: 2.5,
              background: isDark ? "rgba(216,187,122,0.15)" : "rgba(89,101,34,0.1)",
            }}
          >
            {/* Fill */}
            <motion.div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #4D581E 0%, #596522 40%, #C49A45 75%, #D8BB7A 100%)",
                boxShadow: isDark
                  ? "0 0 12px rgba(216,187,122,0.7)"
                  : "0 0 8px rgba(196,154,69,0.5)",
                transformOrigin: "left",
              }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* Footer Branding */}
          <div className="flex justify-between items-center px-6 sm:px-8 py-3.5">
            <span
              className="font-sans font-medium"
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                color: isDark ? "rgba(255,255,255,0.45)" : "rgba(48,53,21,0.7)",
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
                color: isDark ? "#D8BB7A" : "#596522",
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
