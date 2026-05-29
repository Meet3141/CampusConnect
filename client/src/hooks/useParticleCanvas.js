import { useEffect } from "react";

const COLOR_FALLBACKS = {
  brand: "#004F9F",
  accent: "#06B6D4",
};

const readCssVar = (name, fallback) => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

const parseColor = (value) => {
  const raw = value.trim();
  if (raw.startsWith("#")) {
    const hex = raw.slice(1);
    const normalized = hex.length === 3
      ? hex.split("").map((c) => c + c).join("")
      : hex.padEnd(6, "0");
    const int = parseInt(normalized, 16);
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255,
    };
  }

  const match = raw.match(/rgba?\(([^)]+)\)/i);
  if (match) {
    const [r, g, b] = match[1].split(",").map((part) => parseFloat(part.trim()));
    return { r: r ?? 0, g: g ?? 0, b: b ?? 0 };
  }

  return { r: 0, g: 0, b: 0 };
};

const toRgba = (rgb, alpha) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

export default function useParticleCanvas(canvasRef) {
  useEffect(() => {
    const brandRgb  = parseColor(readCssVar("--cc-color-brand", COLOR_FALLBACKS.brand));
    const accentRgb = parseColor(readCssVar("--cc-color-accent", COLOR_FALLBACKS.accent));
    const BRAND      = toRgba(brandRgb, 0.85);
    const BRAND_GLOW = toRgba(brandRgb, 0.38);
    const BRAND_FADE = toRgba(brandRgb, 0);
    const BRAND_LINK = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b},`;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animId;
    const mouse = { x: null, y: null };

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    canvas.addEventListener("mousemove",  handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const particleCount = 55;
    const particles = Array.from({ length: particleCount }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      vx:    (Math.random() - 0.5) * 0.35,
      vy:    (Math.random() - 0.5) * 0.35,
      r:     Math.random() * 1.8 + 1.2,
      phase: Math.random() * Math.PI * 2,
    }));

    const linkDistance = 140;

    const tick = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -10)                particle.x = canvas.width + 10;
        if (particle.x > canvas.width + 10)  particle.x = -10;
        if (particle.y < -10)                particle.y = canvas.height + 10;
        if (particle.y > canvas.height + 10) particle.y = -10;

        if (mouse.x !== null) {
          const dx = particle.x - mouse.x;
          const dy = particle.y - mouse.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 110) {
            const force = ((110 - distance) / 110) * 0.025;
            particle.x += dx * force;
            particle.y += dy * force;
          }
        }

        const pulse = particle.r + Math.sin(time * 0.0009 + particle.phase) * 0.7;

        /* Radial glow — brand primary */
        const glow = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, pulse * 4
        );
        glow.addColorStop(0,   BRAND);
        glow.addColorStop(0.4, BRAND_GLOW);
        glow.addColorStop(1,   BRAND_FADE);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, pulse * 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        /* Solid particle core */
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, pulse, 0, Math.PI * 2);
        ctx.fillStyle = toRgba(brandRgb, 0.88);
        ctx.fill();

        /* Connection lines — accent (sky-surge) tint */
        for (let j = index + 1; j < particles.length; j++) {
          const other    = particles[j];
          const dx       = particle.x - other.x;
          const dy       = particle.y - other.y;
          const distance = Math.hypot(dx, dy);

          if (distance < linkDistance) {
            const alpha    = (1 - distance / linkDistance) * 0.22;
            const gradient = ctx.createLinearGradient(particle.x, particle.y, other.x, other.y);
            gradient.addColorStop(0, `${BRAND_LINK}${alpha})`);
            gradient.addColorStop(1, `${BRAND_LINK}${alpha * 0.5})`);

            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth   = 0.7;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      canvas.removeEventListener("mousemove",  handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [canvasRef]);
}