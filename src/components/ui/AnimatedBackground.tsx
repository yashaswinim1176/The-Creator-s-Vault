import React, { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Track frame ticks
    let scanLineY = 0;
    
    // Grid settings
    const gridSize = 60;
    
    // Particles setup
    interface CyberParticle {
      x: number;
      y: number;
      text: string;
      speed: number;
      opacity: number;
      maxOpacity: number;
      fadeSpeed: number;
      size: number;
    }
    
    const particles: CyberParticle[] = [];
    const maxParticles = 40;
    const hexChars = ["0", "1", "V", "A", "U", "L", "T", "F", "E", "8", "9", "A", "C", "D"];

    const createParticle = (randomY = false): CyberParticle => {
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : height + 20,
        text: hexChars[Math.floor(Math.random() * hexChars.length)] + hexChars[Math.floor(Math.random() * hexChars.length)],
        speed: 0.2 + Math.random() * 0.4,
        opacity: 0,
        maxOpacity: 0.05 + Math.random() * 0.12,
        fadeSpeed: 0.002 + Math.random() * 0.005,
        size: 9 + Math.floor(Math.random() * 6),
      };
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width;
      canvas.height = height;

      // Populate initial particles over the entire screen
      if (particles.length === 0) {
        for (let i = 0; i < maxParticles; i++) {
          particles.push(createParticle(true));
        }
      }
    };

    // Responsive sizing using ResizeObserver as requested
    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    resize();

    // Mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Animation Loop
    const render = () => {
      // Clear with very dark slate backgound representing #0a0a0a
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, width, height);

      // Interpolate mouse position for smooth trailing spring effect
      const mouse = mouseRef.current;
      if (mouse.targetX !== -1000) {
        if (mouse.x === -1000) {
          mouse.x = mouse.targetX;
          mouse.y = mouse.targetY;
        } else {
          mouse.x += (mouse.targetX - mouse.x) * 0.08;
          mouse.y += (mouse.targetY - mouse.y) * 0.08;
        }
      } else {
        mouse.x = -1000;
        mouse.y = -1000;
      }

      // Draw Grid
      ctx.strokeStyle = "rgba(0, 255, 189, 0.015)";
      ctx.lineWidth = 1;
      
      const gridOffset = 0;
      
      // Draw gridlines
      ctx.beginPath();
      for (let x = gridOffset; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = gridOffset; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Draw horizontal scanning laser line
      scanLineY += 0.8;
      if (scanLineY > height) scanLineY = 0;
      
      const scanGradient = ctx.createLinearGradient(0, scanLineY - 150, 0, scanLineY + 2);
      scanGradient.addColorStop(0, "rgba(0, 255, 189, 0)");
      scanGradient.addColorStop(0.95, "rgba(0, 255, 189, 0.02)");
      scanGradient.addColorStop(1, "rgba(0, 255, 189, 0.06)");
      
      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, scanLineY - 150, width, 150);

      // Draw dynamic glowing intersection dots near scanning laser and mouse
      ctx.fillStyle = "rgba(0, 255, 189, 0.15)";
      const dotRadius = 1;
      const scanImpactZone = 120;

      for (let x = gridOffset; x < width; x += gridSize) {
        for (let y = gridOffset; y < height; y += gridSize) {
          // Calculate distance to scanline
          const distToScan = Math.abs(y - scanLineY);
          
          // Calculate distance to mouse
          let isGlow = false;
          let glowFactor = 0;
          if (mouse.x !== -1000) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const distToMouse = Math.sqrt(dx * dx + dy * dy);
            if (distToMouse < 180) {
              isGlow = true;
              glowFactor = (1 - distToMouse / 180) * 0.4;
            }
          }

          if (distToScan < scanImpactZone) {
            const scanGlow = (1 - distToScan / scanImpactZone) * 0.15;
            glowFactor = Math.max(glowFactor, scanGlow);
            isGlow = true;
          }

          if (isGlow || (x % (gridSize * 3) === 0 && y % (gridSize * 3) === 0)) {
            ctx.fillStyle = `rgba(0, 255, 189, ${0.04 + glowFactor})`;
            ctx.beginPath();
            ctx.arc(x, y, dotRadius + (glowFactor * 1.5), 0, Math.PI * 2);
            ctx.fill();

            // Sometime draw subtle code-brackets near glow nodes for technical feel
            if (glowFactor > 0.3 && Math.random() < 0.005) {
              ctx.fillStyle = `rgba(0, 255, 189, ${glowFactor * 0.4})`;
              ctx.font = "8px monospace";
              ctx.fillText("[SECURE]", x + 6, y + 3);
            }
          }
        }
      }

      // Render Hex & Binary floating particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.speed;
        
        // Fading behavior
        if (p.opacity < p.maxOpacity) {
          p.opacity += p.fadeSpeed;
        }

        // Apply mouse repel subtly
        if (mouse.x !== -1000) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const force = (100 - dist) / 100 * 0.6;
            p.x += (dx / dist) * force;
          }
        }

        // Draw particle
        ctx.fillStyle = `rgba(0, 255, 189, ${p.opacity})`;
        ctx.font = `${p.size}px monospace`;
        ctx.fillText(p.text, p.x, p.y);

        // Replace out-of-screen or fully faded particles
        if (p.y < -20) {
          particles[i] = createParticle();
        }
      }

      // Draw Cursor Shield Bubble (Defense System)
      if (mouse.x !== -1000) {
        // Draw primary core glowing spot
        ctx.beginPath();
        const radGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
        radGlow.addColorStop(0, "rgba(0, 255, 189, 0.07)");
        radGlow.addColorStop(0.5, "rgba(0, 255, 189, 0.015)");
        radGlow.addColorStop(1, "rgba(0, 255, 189, 0)");
        ctx.fillStyle = radGlow;
        ctx.arc(mouse.x, mouse.y, 160, 0, Math.PI * 2);
        ctx.fill();

        // Draw tactical shield target lines (concentric defense bounds)
        ctx.strokeStyle = "rgba(0, 255, 189, 0.06)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 60, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(0, 255, 189, 0.02)";
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 110, 0, Math.PI * 2);
        ctx.stroke();

        // Draw a tiny rotating defense ring notch
        const angle = (Date.now() / 1500) % (Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 255, 189, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 60, angle, angle + (Math.PI / 4));
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 60, angle + Math.PI, angle + Math.PI + (Math.PI / 4));
        ctx.stroke();

        // Small indicator text
        ctx.fillStyle = "rgba(0, 255, 189, 0.25)";
        ctx.font = "9px monospace";
        ctx.fillText("SHIELD ACTIVE", mouse.x + 70, mouse.y - 12);
        
        ctx.strokeStyle = "rgba(0, 255, 189, 0.12)";
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(mouse.x + 65, mouse.y - 15);
        ctx.lineTo(mouse.x + 150, mouse.y - 15);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none block z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
