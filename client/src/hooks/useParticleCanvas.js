import { useEffect } from "react";

/* ── Brand primary colour palette (matches --cc-color-brand = #004F9F) ── */
const BRAND       = "rgba(0,79,159,0.85)";   // particle core
const BRAND_GLOW  = "rgba(0,79,159,0.38)";   // inner glow
const BRAND_FADE  = "rgba(0,79,159,0)";       // outer glow edge
const BRAND_LINK  = "rgba(0,188,235,";        // connection lines (accent)

export default function useParticleCanvas(canvasRef) {
  useEffect(() => {
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
        ctx.fillStyle = "rgba(0,79,159,0.88)";
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