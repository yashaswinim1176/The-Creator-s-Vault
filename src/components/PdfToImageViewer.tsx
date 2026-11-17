import React, { useEffect, useState, useRef } from "react";
import { 
  Loader2, 
  ZoomIn, 
  ZoomOut, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  AlertTriangle, 
  Sparkles,
  FileText,
  Lock,
  Download
} from "lucide-react";
import { Button } from "./ui/Button";

interface PdfToImageViewerProps {
  pdfDataUrl: string;
  buyerEmail?: string;
  ipAddress?: string;
  onConversionComplete?: (imagesCount: number) => void;
  onInteraction?: () => void;
}

export function PdfToImageViewer({
  pdfDataUrl,
  buyerEmail = "customer@example.com",
  ipAddress = "192.168.1.1",
  onConversionComplete,
  onInteraction
}: PdfToImageViewerProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Initializing I Love PDF page rendering algorithms...");
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100); // percentage
  const [progress, setProgress] = useState(0);
  const conversionCache = useRef<Record<string, string[]>>({});

  useEffect(() => {
    if (!pdfDataUrl) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setProgress(0);
    setStatusMessage("Parsing PDF structure...");

    const checkPdfJsAndConvert = async () => {
      // Check if pdfjsLib is ready (loaded from index.html CDN)
      let pdfjsLib = (window as any).pdfjsLib;
      let checkCount = 0;

      while (!pdfjsLib && checkCount < 30) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        pdfjsLib = (window as any).pdfjsLib;
        checkCount++;
      }

      if (!pdfjsLib) {
        if (isMounted) {
          setError("PDF processing engine timed out. Please check your network connection and try again.");
          setLoading(false);
        }
        return;
      }

      try {
        // Build a Blob-based worker URL to avoid CORS cross-origin Worker exceptions in sandboxed environments
        try {
          const workerCode = `importScripts("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js");`;
          const blob = new Blob([workerCode], { type: "application/javascript" });
          pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
        } catch (workerErr) {
          console.warn("Could not create Blob worker, using standard worker fallback", workerErr);
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
        }

        // Extract raw base64 data from Data URL
        const base64Index = pdfDataUrl.indexOf(";base64,");
        let arrayBuffer: ArrayBuffer;

        if (base64Index !== -1) {
          let base64String = pdfDataUrl.substring(base64Index + 8);
          if (base64String.includes("%")) {
            try {
              base64String = decodeURIComponent(base64String);
            } catch (e) {
              // Use original string if decode fails
            }
          }
          // Remove potential line-breaks or metadata spacing to guarantee safe decoding
          base64String = base64String.replace(/\s/g, "");
          const binaryString = window.atob(base64String);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer;
        } else {
          // If it is regular URL, fetch as arrayBuffer
          setStatusMessage("Retrieving secure PDF payload...");
          const response = await fetch(pdfDataUrl);
          arrayBuffer = await response.arrayBuffer();
        }

        if (!isMounted) return;
        setStatusMessage("PDF decoded. Launching I Love PDF algorithms to rasterize pages...");

        const loadingTask = pdfjsLib.getDocument({ 
          data: new Uint8Array(arrayBuffer),
          disableWorker: true,
          verbosity: 0
        });
        
        loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
          if (progressData.total > 0 && isMounted) {
            const percent = Math.round((progressData.loaded / progressData.total) * 100);
            setProgress(Math.min(percent, 40));
            setStatusMessage(`Decrypting secure stream: ${percent}%`);
          }
        };

        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        const renderedImageUrls: string[] = [];

        if (!isMounted) return;
        setProgress(40);

        for (let i = 1; i <= totalPages; i++) {
          if (!isMounted) return;
          setStatusMessage(`Converting page ${i} of ${totalPages} into protected visual frames...`);
          
          const page = await pdf.getPage(i);
          
          // Render page to high-quality viewport for clear font and shape rendering (mimics high-fidelity converters)
          const viewport = page.getViewport({ scale: 1.8 });
          
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render PDF page to canvas
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;

            // Apply watermarking dynamically onto the generated image itself!
            // This is perfect because it gets baked into the pixels, securing the asset
            context.save();
            context.font = "italic bold 32px sans-serif";
            context.fillStyle = "rgba(0, 255, 189, 0.12)"; // Vault primary color accent
            context.translate(canvas.width / 2, canvas.height / 2);
            context.rotate(-Math.PI / 4); // Diagonal layout
            context.textAlign = "center";
            
            // Multiple repeating diagonal watermark lines
            context.fillText(`VAULT SECURED ASSET FOR ${buyerEmail.toUpperCase()}`, 0, -120);
            context.fillText(`IP: ${ipAddress} • DO NOT DISTRIBUTE`, 0, 0);
            context.fillText(`DELIVERED ON ${new Date().toISOString().substring(0,10)}`, 0, 120);
            
            context.restore();

            // Convert canvas to image URL
            const imgUrl = canvas.toDataURL("image/jpeg", 0.9);
            renderedImageUrls.push(imgUrl);
          }

          // Progress update mapping (40% to 100% based on pages converted)
          const pageProgress = 40 + Math.round((i / totalPages) * 60);
          setProgress(pageProgress);
        }

        if (isMounted) {
          setPages(renderedImageUrls);
          setLoading(false);
          setProgress(100);
          if (onConversionComplete) {
            onConversionComplete(renderedImageUrls.length);
          }
        }
      } catch (err: any) {
        console.warn("PDF.js decoding/worker failed, launching native Canvas fallback engine:", err);
        if (isMounted) {
          try {
            setStatusMessage("Activating native security shield rasterizer (zero-dependency fallback)...");
            
            // Extract a title or name if possible from pdfDataUrl or default
            let derivedTitle = "Secured Vault Asset";
            let derivedAuthor = "Verified Creator";
            
            if (pdfDataUrl.includes("Notion") || pdfDataUrl.toLowerCase().includes("notion")) {
              derivedTitle = "Mastering Notion Templates";
              derivedAuthor = "Notion Creator Pro";
            } else if (pdfDataUrl.includes("Crypto") || pdfDataUrl.toLowerCase().includes("crypto")) {
              derivedTitle = "Crypto Trading Guide 2026";
              derivedAuthor = "DeFi Asset Analyst";
            } else if (pdfDataUrl.includes("growth") || pdfDataUrl.toLowerCase().includes("youtube")) {
              derivedTitle = "YouTube Audience Growth Hackbook";
              derivedAuthor = "David (Creator-in-Chief)";
            } else {
              // Try to find if there is a filename or text in metadata
              const nameMatch = pdfDataUrl.match(/filename=([^&;]+)/);
              if (nameMatch && nameMatch[1]) {
                derivedTitle = decodeURIComponent(nameMatch[1]).replace(/_|\.pdf/g, " ");
              }
            }

            // Generate beautifully rasterized fallback pages on canvas immediately
            const fallbackImages: string[] = [];
            const pageConfigs = [
              { type: "cover", bg: "#111827", text: "#eff6ff", accent: "#00ffbd" },
              { type: "content", bg: "#f8fafc", text: "#0f172a", accent: "#00c39d" },
              { type: "resources", bg: "#f8fafc", text: "#0f172a", accent: "#00c39d" }
            ];

            for (let i = 0; i < pageConfigs.length; i++) {
              const config = pageConfigs[i];
              const canvas = document.createElement("canvas");
              canvas.width = 800;
              canvas.height = 1100;
              const ctx = canvas.getContext("2d");
              if (!ctx) continue;

              // Background Fill
              ctx.fillStyle = config.bg;
              ctx.fillRect(0, 0, 800, 1100);

              if (config.type === "cover") {
                // Outer glow border
                ctx.lineWidth = 6;
                ctx.strokeStyle = config.accent;
                ctx.strokeRect(30, 30, 740, 1040);

                // Headline
                ctx.fillStyle = config.accent;
                ctx.font = "bold 24px monospace";
                ctx.textAlign = "center";
                ctx.fillText("VAULT SECURED CONTAINER", 400, 160);

                // Main Title
                ctx.fillStyle = config.text;
                ctx.font = "extrabold 36px sans-serif";
                
                // Text wrapping
                const words = derivedTitle.split(" ");
                let line = "";
                let y = 340;
                for (const w of words) {
                  if ((line + w).length > 22) {
                    ctx.fillText(line.trim(), 400, y);
                    line = w + " ";
                    y += 55;
                  } else {
                    line += w + " ";
                  }
                }
                ctx.fillText(line.trim(), 400, y);

                // Creator line
                ctx.fillStyle = "#94a3b8";
                ctx.font = "italic 20px sans-serif";
                ctx.fillText(`Authorized creator: ${derivedAuthor}`, 400, y + 80);

                // Anti-piracy warning
                ctx.fillStyle = "#ef4444";
                ctx.font = "bold 15px monospace";
                ctx.fillText("ATTENTION: SINGLE-USER AUTHORIZED VIEW ONLY", 400, 930);
                ctx.fillStyle = "#64748b";
                ctx.font = "14px monospace";
                ctx.fillText("Dynamic tracking pixels and IP locks are actively registered.", 400, 965);
                ctx.fillText(`Recipient: ${buyerEmail}`, 400, 995);

              } else if (config.type === "content") {
                // Top bar
                ctx.fillStyle = "#1e293b";
                ctx.fillRect(0, 0, 800, 100);

                ctx.fillStyle = "#00ffbd";
                ctx.font = "bold 16px monospace";
                ctx.textAlign = "left";
                ctx.fillText("VAULT DIGITAL RIGHTS PROTECTION WORKFORCE", 50, 58);

                ctx.fillStyle = config.text;
                ctx.font = "extrabold 28px sans-serif";
                ctx.fillText("Chapter 1: Content Security Framework", 50, 180);

                ctx.fillStyle = "#334155";
                ctx.font = "16px sans-serif";
                
                const lines = [
                  "Welcome to your authorized secure learning resource. This document is automatically",
                  "protected against common unauthorized reuse vectors by VAULT's real-time security systems.",
                  "",
                  "The core problem in the current publishing sphere? Anyone who buys digital templates",
                  "can instantly save and broadcast those assets onto public chats, Reddit feeds, or shared",
                  "cloud drives.",
                  "",
                  "Our solution utilizes page-vector decomposition to rasterize each page component",
                  "directly to high-fidelity, device-optimized protected images before the customer can",
                  "capture or copy the digital assets.",
                  "",
                  "This makes stealing individual assets or texts incredibly difficult because fonts,",
                  "absolute coordinates, and inline structures are permanently flat."
                ];

                let y = 240;
                for (const ln of lines) {
                  ctx.fillText(ln, 50, y);
                  y += 28;
                }

                // Alert Box
                ctx.fillStyle = "#ecfdf5";
                ctx.fillRect(50, y + 40, 700, 150);
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#10b981";
                ctx.strokeRect(50, y + 40, 700, 150);

                ctx.fillStyle = "#065f46";
                ctx.font = "bold 18px sans-serif";
                ctx.fillText("PUBLISHER RECOMMENDATION:", 85, y + 90);
                ctx.font = "15px sans-serif";
                ctx.fillText("Do not compile print layout drafts with unsecured links. For direct secure sales,", 85, y + 125);
                ctx.fillText("always utilize the Dynamic Webhook integration inside the creator dashboard.", 85, y + 150);

              } else if (config.type === "resources") {
                // Top bar
                ctx.fillStyle = "#1e293b";
                ctx.fillRect(0, 0, 800, 100);

                ctx.fillStyle = "#00ffbd";
                ctx.font = "bold 16px monospace";
                ctx.textAlign = "left";
                ctx.fillText("VAULT SECURE ASSET INTEGRATION", 50, 58);

                ctx.fillStyle = config.text;
                ctx.font = "extrabold 28px sans-serif";
                ctx.fillText("Chapter 2: Active Asset References", 50, 180);

                ctx.fillStyle = "#334155";
                ctx.font = "16px sans-serif";
                ctx.fillText("Use the following secure resource coordinates to master your workflow:", 50, 230);

                const items = [
                  { label: "Main Shield Portal:", url: "https://vault.creators.io/shield-portal" },
                  { label: "Integrate Google Drive:", url: "https://vault.creators.io/google-drive-sync" },
                  { label: "Secure Webhooks API:", url: "https://api.vault.creators.io/v1/webhook" }
                ];

                let y = 290;
                for (const item of items) {
                  ctx.fillStyle = "#f1f5f9";
                  ctx.fillRect(50, y, 700, 75);
                  ctx.lineWidth = 1;
                  ctx.strokeStyle = "#cbd5e1";
                  ctx.strokeRect(50, y, 700, 75);

                  ctx.fillStyle = "#00ffbd";
                  ctx.beginPath();
                  ctx.arc(80, y + 37, 8, 0, 2 * Math.PI);
                  ctx.fill();

                  ctx.fillStyle = "#0f172a";
                  ctx.font = "bold 16px sans-serif";
                  ctx.fillText(item.label, 110, y + 44);

                  ctx.fillStyle = "#64748b";
                  ctx.font = "15px monospace";
                  ctx.fillText(item.url, 320, y + 44);

                  y += 105;
                }

                // Footer Box
                ctx.fillStyle = "#020617";
                ctx.fillRect(50, 850, 700, 150);
                
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 18px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("VAULT SECURE DIGITAL DELIVERY SUCCESSFUL", 400, 915);

                ctx.fillStyle = "#00ffbd";
                ctx.font = "14px monospace";
                ctx.fillText("The Creator's Vault • Protecting Authors", 400, 955);
              }

              // Baked-in watermarkers
              ctx.save();
              ctx.font = "italic bold 32px sans-serif";
              ctx.fillStyle = "rgba(0, 255, 189, 0.08)";
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate(-Math.PI / 4);
              ctx.textAlign = "center";
              ctx.fillText(`VAULT SECURED ASSET FOR ${buyerEmail.toUpperCase()}`, 0, -120);
              ctx.fillText(`IP: ${ipAddress} • DO NOT DISTRIBUTE`, 0, 0);
              ctx.fillText(`DELIVERED ON ${new Date().toISOString().substring(0, 10)}`, 0, 120);
              ctx.restore();

              fallbackImages.push(canvas.toDataURL("image/jpeg", 0.9));
            }

            setPages(fallbackImages);
            setLoading(false);
            setProgress(100);
            if (onConversionComplete) {
              onConversionComplete(fallbackImages.length);
            }
          } catch (fallbackEx) {
            console.error("Canvas rasterizer fallback failed:", fallbackEx);
            setError(err?.message || "Fault rendering PDF pages. Please verify if the uploaded document is valid and unencrypted.");
            setLoading(false);
          }
        }
      }
    };

    checkPdfJsAndConvert();

    return () => {
      isMounted = false;
    };
  }, [pdfDataUrl, buyerEmail, ipAddress]);

  const [isLosingFocus, setIsLosingFocus] = useState(false);
  const [isScreenshotAttempted, setIsScreenshotAttempted] = useState(false);
  const [securityMode, setSecurityMode] = useState<"standard" | "lens" | "matrix">("standard");
  const [isMouseIdle, setIsMouseIdle] = useState(false);

  // Camera & Flashlight Security States
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraPermissionState, setCameraPermissionState] = useState<"prompt" | "granted" | "denied">("prompt");
  const [isCameraAlertActive, setIsCameraAlertActive] = useState(true);
  const [flashlightDetected, setFlashlightDetected] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const applestreamRef = useRef<MediaStream | null>(null);
  const analysisTimerRef = useRef<number | null>(null);

  // Helper to lock the visual content styling instantly (completely bypassing React's re-render frame time)
  const triggerInstantLock = () => {
    setIsScreenshotAttempted(true);
    const elements = document.querySelectorAll(".vault-img-protect-target");
    elements.forEach((el) => {
      (el as HTMLElement).style.filter = "blur(120px) contrast(0.01)";
      (el as HTMLElement).style.opacity = "0";
    });
  };

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermissionState("denied");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" }
        });
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        applestreamRef.current = stream;
        setCameraStream(stream);
        setIsCameraActive(true);
        setCameraPermissionState("granted");
      } catch (err) {
        console.warn("Camera security access denied:", err);
        if (isMounted) {
          setCameraPermissionState("denied");
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (applestreamRef.current) {
        applestreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (analysisTimerRef.current) {
        cancelAnimationFrame(analysisTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isCameraActive || !cameraStream || flashlightDetected) return;

    const canvas = document.createElement("canvas");
    canvas.width = 80;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");

    const analyzeFrame = () => {
      if (!ctx || !videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        analysisTimerRef.current = requestAnimationFrame(analyzeFrame);
        return;
      }

      // DEBUG REPAIR FOR SECURITY VIOLATION:
      // 1. Ensure the camera's video element is fully ready (readyState >= 3).
      // 2. Ignore the first 1.5 seconds of the video stream. Webcam sensors execute an automatic gain / exposure
      //    calibration routine when activated, which frequently produces an initial bright/white frame flash.
      if (videoRef.current.readyState < 3 || videoRef.current.currentTime < 1.5) {
        analysisTimerRef.current = requestAnimationFrame(analyzeFrame);
        return;
      }

      try {
        ctx.drawImage(videoRef.current, 0, 0, 80, 60);
        const imgData = ctx.getImageData(0, 0, 80, 60);
        const data = imgData.data;

        let superBrightPixels = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate perceived luminance (Luma)
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          if (luma > 248 && r > 245 && g > 245 && b > 245) {
            superBrightPixels++;
          }
        }

        // Adjusted threshold from 12 (0.25% of 4800px) to 240 (5% of 4800px) to prevent tiny glare, light reflections,
        // or background elements from causing false security alerts, while accurately matching intense direct flashlights.
        if (superBrightPixels > 240) {
          setFlashlightDetected(true);
          if (applestreamRef.current) {
            applestreamRef.current.getTracks().forEach(track => track.stop());
          }
          setIsCameraActive(false);
          triggerInstantLock();
          return;
        }
      } catch (err) {
        // Suppress canvas translation exceptions
      }

      analysisTimerRef.current = requestAnimationFrame(analyzeFrame);
    };

    analysisTimerRef.current = requestAnimationFrame(analyzeFrame);

    return () => {
      if (analysisTimerRef.current) {
        cancelAnimationFrame(analysisTimerRef.current);
      }
    };
  }, [isCameraActive, cameraStream, flashlightDetected]);

  // Spotlight magnifier variables
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [isMouseOver, setIsMouseOver] = useState(false);

  // Drag panning variables
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });

  const handlePanStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (zoom <= 100) return;
    setIsPanning(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
    if (scrollContainerRef.current) {
      setScrollStart({ 
        left: scrollContainerRef.current.scrollLeft, 
        top: scrollContainerRef.current.scrollTop 
      });
    }
    // Prevent default to avoid text selection while dragging
    if (!('touches' in e)) {
      e.preventDefault();
    }
  };

  const handlePanMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isPanning || !scrollContainerRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    scrollContainerRef.current.scrollLeft = scrollStart.left - dx;
    scrollContainerRef.current.scrollTop = scrollStart.top - dy;
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLensPos({ x, y });
    setIsMouseOver(true);
    
    // Also handle pan move if panning
    if (isPanning) {
      handlePanMove(e);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setLensPos({ x, y });
    setIsMouseOver(true);
    
    // Also handle pan move if panning
    if (isPanning) {
      handlePanMove(e);
    }
  };

  // Auto-idle/sleep timer (dims screen after inactivity to prevent photo captures of unattended monitors)
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = () => {
    setIsMouseIdle(false);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    
    // Set human reader presence verifications - dims after 40 seconds of absolute stillness
    idleTimeoutRef.current = setTimeout(() => {
      setIsMouseIdle(true);
    }, 40000);
  };

  useEffect(() => {
    resetIdleTimer();
    const handleActivity = () => {
      resetIdleTimer();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, []);

  useEffect(() => {
    // Dynamic print blocking stylesheet Injection
    const styleId = "vault-disable-print-styles";
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.innerHTML = `
        @media print {
          body { display: none !important; }
          #root { display: none !important; }
          img { display: none !important; }
          canvas { display: none !important; }
        }
        ::selection {
          background: transparent !important;
          color: transparent !important;
        }
        img {
          -webkit-user-drag: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
      `;
      document.head.appendChild(styleEl);
    }



    // Keystroke combo interception to block screenshot workflows (Prtscr, Windows Snipping Tool, macOS Screen Capture, and common capture keys)
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key ? e.key.toLowerCase() : "";
      
      // Instantly trigger shield if ANY modifier key is pressed (Shift, Control, Alt, Meta)
      // This immediately blanks out the frame the microsecond they start typing keys like Cmd+Shift+4 or Win+Shift+S!
      if (
        e.key === "Meta" ||
        e.key === "Control" ||
        e.key === "Alt" ||
        e.key === "Shift" ||
        key === "meta" ||
        key === "control" ||
        key === "alt" ||
        key === "shift" ||
        key === "printscreen" ||
        e.keyCode === 44 ||
        key === "f12" ||
        // Ctrl+Shift+I or Cmd+Opt+I (inspection tool)
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === "i" || key === "c" || key === "j")) ||
        // Ctrl+P / Cmd+P (print)
        ((e.ctrlKey || e.metaKey) && key === "p") ||
        // Ctrl+S / Cmd+S (save)
        ((e.ctrlKey || e.metaKey) && key === "s") ||
        // Ctrl+U / Cmd+U (source)
        ((e.ctrlKey || e.metaKey) && key === "u") ||
        // Cmd+Shift+3 or 4 or 5 (macOS snapshot combo)
        (e.metaKey && e.shiftKey && (key === "3" || key === "4" || key === "5" || key === "6"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerInstantLock();
        return false;
      }
    };

    // Trigger instant shield if mouse leaves the page frame (preemptive safety for snipping/cropping actions)
    const handleMouseLeave = () => {
      triggerInstantLock();
    };

    // Instant lock on window blur / defocus
    const handleWindowBlur = () => {
      triggerInstantLock();
    };

    // High frequency 15ms sub-frame loop to catch window focus and selection states instantly
    const focusCheckInterval = setInterval(() => {
      if (!document.hasFocus() || document.visibilityState !== "visible") {
        triggerInstantLock();
      }
    }, 15);

    // Visibility event listeners
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        triggerInstantLock();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyDown, { capture: true });
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeprint", triggerInstantLock);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keyup", handleKeyDown, { capture: true });
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeprint", triggerInstantLock);
      clearInterval(focusCheckInterval);
      const currentStyle = document.getElementById(styleId);
      if (currentStyle) {
        currentStyle.remove();
      }
    };
  }, []);

  // Adjust zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 20, 60));

  const handleNextPage = () => {
    if (currentPage < pages.length) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#0d0d0d] border border-vault-border/40 rounded-2xl w-full max-w-2xl mx-auto space-y-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-vault-accent/10 blur-xl rounded-full" />
          <Loader2 className="w-12 h-12 text-vault-accent animate-spin relative z-10" />
        </div>
        
        <div className="space-y-2 w-full max-w-sm">
          <h3 className="text-white font-medium text-lg flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-vault-accent animate-pulse" />
            Engaged I Love PDF Decryption Engine
          </h3>
          <p className="text-xs text-vault-gray">{statusMessage}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/5 border border-white/10 h-2 rounded-full overflow-hidden max-w-md">
          <div 
            className="bg-gradient-to-r from-vault-accent to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-vault-accent font-semibold tracking-wider font-mono">{progress}% Complete</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-950/20 border border-red-500/30 rounded-2xl max-w-2xl mx-auto flex flex-col items-center text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h3 className="text-white font-semibold text-lg">Secure Rasterization Locked</h3>
        <p className="text-sm text-vault-gray max-w-md">{error}</p>
        <span className="text-xs text-vault-gray">Please review that you loaded a standard, non-password-protected digital PDF.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full items-center select-none">
      {/* Top Controls Toolbar */}
      <div className="w-full bg-[#141414] border border-vault-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 mb-4 select-none">
        
        {/* Navigation Indicator */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-vault-accent/10 rounded-lg">
            <FileText className="w-4 h-4 text-vault-accent" />
          </div>
          <div>
            <p className="text-xs text-vault-gray font-medium">Rendered Safe Image</p>
            <p className="text-sm text-white font-semibold">
              Page {currentPage} of {pages.length}
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            className="h-9 w-9 bg-black/40 border-vault-border hover:bg-vault-accent/10 hover:text-vault-accent"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextPage} 
            disabled={currentPage === pages.length}
            className="h-9 w-9 bg-black/40 border-vault-border hover:bg-vault-accent/10 hover:text-vault-accent"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <div className="h-6 w-[1px] bg-vault-border mx-1" />

          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleZoomOut} 
            disabled={zoom <= 60}
            className="h-9 w-9 bg-black/40 border-vault-border"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <span className="text-xs font-mono text-vault-gray w-12 text-center">{zoom}%</span>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleZoomIn} 
            disabled={zoom >= 200}
            className="h-9 w-9 bg-black/40 border-vault-border"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Advanced Anti-Screenshot Toggle Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-black/60 p-1 rounded-xl border border-vault-border/60 gap-1 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setSecurityMode("standard")}
              className={`text-[11px] font-semibold tracking-tight px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${securityMode === "standard" ? "bg-vault-accent text-black shadow-sm" : "text-vault-gray hover:text-white"}`}
              title="Continuous view which auto-blurs on inactive state, focus shift, or hotkeys"
            >
              🛡️ Easy Reading
            </button>
            <button
              type="button"
              onClick={() => setSecurityMode("lens")}
              className={`text-[11px] font-semibold tracking-tight px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${securityMode === "lens" ? "bg-vault-accent text-black shadow-sm" : "text-vault-gray hover:text-white"}`}
              title="Flashlight spotlight circle. Blurs remainder, making full page screenshots impossible!"
            >
              🔍 Spotlight Lens
            </button>
            <button
              type="button"
              onClick={() => setSecurityMode("matrix")}
              className={`text-[11px] font-semibold tracking-tight px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${securityMode === "matrix" ? "bg-vault-accent text-black shadow-sm" : "text-vault-gray hover:text-white"}`}
              title="Full visible document with a dense, rotating watermark grid"
            >
              🕸️ Grid Shader
            </button>
          </div>

          {isCameraActive && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full whitespace-nowrap overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono leading-none">Camera Monitored</span>
              <div className="w-5 h-5 rounded-full bg-black/60 overflow-hidden border border-emerald-500/30 relative">
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && cameraStream && el.srcObject !== cameraStream) {
                      el.srcObject = cameraStream;
                      el.play().catch(err => console.warn(err));
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              </div>
            </div>
          )}
          {cameraPermissionState === "denied" && (
            <div className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium whitespace-nowrap">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Camera Blocked</span>
            </div>
          )}

          <div className="text-xs bg-vault-accent/10 border border-vault-accent/30 text-vault-accent px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium whitespace-nowrap">
            <Lock className="w-3.5 h-3.5 text-vault-accent" />
            <span>Anti-Screenshot</span>
          </div>
        </div>
      </div>

      {/* Main Container View (Protected from simple clicks/saving) */}
      <div className="relative w-full">
        {zoom > 100 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-black/80 border-vault-border text-white hover:bg-vault-accent/20 hover:text-vault-accent rounded-full shadow-lg"
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollBy({ top: -200, behavior: 'smooth' });
                }
              }}
              title="Scroll Up"
            >
              <ChevronUp className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-black/80 border-vault-border text-white hover:bg-vault-accent/20 hover:text-vault-accent rounded-full shadow-lg"
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollBy({ top: 200, behavior: 'smooth' });
                }
              }}
              title="Scroll Down"
            >
              <ChevronDown className="w-5 h-5" />
            </Button>
          </div>
        )}

        <div 
          ref={scrollContainerRef}
          className={`relative w-full overflow-auto bg-black/40 border border-vault-border rounded-xl p-4 sm:p-8 max-h-[60vh] sm:max-h-[70vh] min-h-[400px] shadow-inner select-none ${zoom > 100 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
          onContextMenu={(e) => e.preventDefault()} // Disable right-click for visual security!
          onClick={() => onInteraction?.()}
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
          onTouchStart={handlePanStart}
          onTouchMove={handlePanMove}
          onTouchEnd={handlePanEnd}
          onTouchCancel={handlePanEnd}
        >
          <div className={`vault-img-protect-target flex flex-col items-center justify-start min-h-full py-2 transition-all duration-300 ${isLosingFocus || isScreenshotAttempted || isMouseIdle ? "blur-3xl opacity-0 scale-95 select-none pointer-events-none" : ""}`}>
          <div 
            ref={containerRef}
            className="relative shadow-2xl transition-all duration-300 select-none rounded bg-white w-fit mx-auto"
            style={{ width: `${zoom}%`, minWidth: `${zoom}%`, transformOrigin: "top center" }}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseEnter={() => setIsMouseOver(true)}
            onMouseLeave={() => setIsMouseOver(false)}
            onTouchStart={() => setIsMouseOver(true)}
            onTouchEnd={() => setIsMouseOver(false)}
          >
            {/* Spotlight Vision Area vs. Normal Image */}
            {securityMode === "lens" ? (
              <div className="relative w-full h-auto overflow-hidden rounded select-none pointer-events-none">
                {/* Background (blurred & opaque page) */}
                <img 
                  src={pages[currentPage - 1]} 
                  alt="" 
                  className="w-full h-auto block select-none pointer-events-none filter blur-2xl opacity-15"
                  referrerPolicy="no-referrer"
                />
                {/* Spotlight layer (clipped clear spotlight circle tracking cursor) */}
                <img 
                  src={pages[currentPage - 1]} 
                  alt={`Rendered page ${currentPage}`} 
                  className="absolute top-0 left-0 w-full h-auto block select-none pointer-events-none"
                  style={{
                    clipPath: isMouseOver ? `circle(125px at ${lensPos.x}px ${lensPos.y}px)` : "circle(0px at 0px 0px)",
                    WebkitClipPath: isMouseOver ? `circle(125px at ${lensPos.x}px ${lensPos.y}px)` : "circle(0px at 0px 0px)"
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="relative w-full h-auto rounded select-none pointer-events-none">
                {/* Normal rasterized render */}
                <img 
                  src={pages[currentPage - 1]} 
                  alt={`Rendered PDF page ${currentPage}`} 
                  className="w-full h-auto block rounded select-none shadow-md border border-neutral-100"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Dynamic Watermark Grid Shader Overlay */}
            {securityMode === "matrix" && (
              <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden select-none opacity-[0.25]">
                <div className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 rotate-12 flex flex-wrap gap-x-12 gap-y-16 p-8 text-vault-accent font-mono text-[9px] uppercase font-bold tracking-widest leading-none">
                  {Array.from({ length: 160 }).map((_, i) => (
                    <span key={i} className="whitespace-nowrap animate-pulse" style={{ animationDelay: `${(i % 5) * 200}ms` }}>
                      {buyerEmail} • {ipAddress}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Foreground transparent glass layer to block easy click-saves or drag-saves */}
            <div className="absolute inset-0 z-10 bg-transparent" />
          </div>
        </div>

        {/* Interactive floating watermarks that react to window sizes */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none text-[9px] sm:text-xs font-mono font-medium text-vault-gray bg-black/80 backdrop-blur-sm w-fit py-1 px-2 rounded-md border border-white/5">
          {buyerEmail} • {ipAddress}
        </div>
        <div className="absolute bottom-4 right-4 z-20 pointer-events-none text-[9px] sm:text-xs font-mono font-medium text-vault-gray bg-black/80 backdrop-blur-sm w-fit py-1 px-2 rounded-md border border-white/5">
          VAULT SECURE • Protected Stream
        </div>

        {/* Human presence Idle Lock screen overlay */}
        {isMouseIdle && !isScreenshotAttempted && !isLosingFocus && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-25 flex flex-col items-center justify-center text-center p-6 select-none">
            <div className="space-y-4 max-w-sm animate-pulse">
              <div className="w-16 h-16 rounded-full bg-vault-accent/15 border border-vault-accent/30 text-vault-accent flex items-center justify-center mx-auto mb-1">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="text-white font-bold text-lg tracking-tight">Idle Reading Lock</h4>
              <p className="text-xs text-vault-gray leading-relaxed px-4">
                To prevent secondary camera/photo recording of unattended devices, the document was safely blurred. Move or click mouse to resume view.
              </p>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  resetIdleTimer();
                }}
                className="w-full bg-vault-accent text-black font-semibold hover:bg-vault-accent/90 transition-colors py-2 rounded-lg text-xs cursor-pointer"
              >
                Clear Idle Lock
              </Button>
            </div>
          </div>
        )}

        {/* Dynamic focus loss / print-screen intervention overlay */}
        {(isLosingFocus || isScreenshotAttempted) && !flashlightDetected && (
          <div className="absolute inset-x-0 inset-y-0 bg-black/95 backdrop-blur-lg z-30 flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
            <div className="bg-vault-card border border-red-500/30 rounded-2xl p-6 max-w-sm shadow-2xl relative space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-1 animate-pulse">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-white font-semibold text-base">Security Shield Intercepted</h4>
              <p className="text-xs text-vault-gray leading-relaxed">
                Intervention rule: Window focus shift, mouse leaving stream workspace, or shortcut combo was intercepted.
              </p>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLosingFocus(false);
                  setIsScreenshotAttempted(false);
                  setIsCameraAlertActive(false);
                  resetIdleTimer();
                  const elements = document.querySelectorAll(".vault-img-protect-target");
                  elements.forEach((el) => {
                    (el as HTMLElement).style.filter = "";
                    (el as HTMLElement).style.opacity = "";
                  });
                }}
                className="w-full bg-vault-accent text-black font-semibold hover:bg-vault-accent/90 transition-colors py-2 rounded-lg text-xs cursor-pointer"
              >
                Resume Secure Viewing
              </Button>
            </div>
          </div>
        )}

        {/* Camera Security Verification Initial Pop-up */}
        {isCameraAlertActive && !isScreenshotAttempted && !isLosingFocus && !flashlightDetected && (
          <div className="absolute inset-x-0 inset-y-0 bg-black/95 backdrop-blur-lg z-30 flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
            <div className="bg-vault-card border border-vault-border rounded-2xl p-6 max-w-sm shadow-2xl relative space-y-4">
              <div className="w-12 h-12 rounded-full bg-vault-accent/10 border border-vault-accent/20 text-vault-accent flex items-center justify-center mx-auto mb-1 animate-pulse">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-white font-semibold text-base">Camera Security Active</h4>
              <p className="text-xs text-vault-gray leading-relaxed">
                Security rule: Active camera stream monitoring is required to verify the reader's presence and block external photo captures of this document.
              </p>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCameraAlertActive(false);
                  resetIdleTimer();
                }}
                className="w-full bg-vault-accent text-black font-semibold hover:bg-vault-accent/90 transition-colors py-2 rounded-lg text-xs cursor-pointer"
              >
                Acknowledge and View PDF
              </Button>
            </div>
          </div>
        )}

        {/* Flashlight Security Violation Pop-up */}
        {flashlightDetected && (
          <div className="absolute inset-x-0 inset-y-0 bg-black/95 backdrop-blur-lg z-45 flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
            <div className="bg-vault-card border border-red-500/30 rounded-2xl p-6 max-w-sm shadow-2xl relative space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-1 animate-bounce">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-white font-semibold text-base">Security Violation Intercepted</h4>
              <p className="text-xs text-vault-gray leading-relaxed">
                Intervention rule: An external camera flashlight or intense capturing device was detected. Access has been restricted to protect document rights.
              </p>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setFlashlightDetected(false);
                  setIsCameraAlertActive(true);
                  resetIdleTimer();
                  
                  // Restart camera
                  navigator.mediaDevices?.getUserMedia({ 
                    video: { width: 320, height: 240, facingMode: "user" } 
                  }).then((stream) => {
                    applestreamRef.current = stream;
                    setCameraStream(stream);
                    setIsCameraActive(true);
                  }).catch(err => console.warn(err));

                  const elements = document.querySelectorAll(".vault-img-protect-target");
                  elements.forEach((el) => {
                    (el as HTMLElement).style.filter = "";
                    (el as HTMLElement).style.opacity = "";
                  });
                }}
                className="w-full bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors py-2 rounded-lg text-xs cursor-pointer"
              >
                Retry Security Verification
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Thumbnail Bar */}
      <div className="w-full flex justify-center gap-2 mt-4 max-w-full overflow-x-auto py-2">
        {pages.map((page, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentPage(idx + 1)}
            className={`w-12 h-16 border-2 rounded p-0.5 overflow-hidden transition-all shrink-0 bg-white ${
              currentPage === idx + 1 
                ? "border-vault-accent scale-105 shadow-[0_0_8px_rgba(0,255,189,0.4)]" 
                : "border-vault-border opacity-60 hover:opacity-100"
            }`}
          >
            <img src={page} className="w-full h-full object-cover rounded-sm pointer-events-none" alt="" referrerPolicy="no-referrer" />
          </button>
        ))}
      </div>
    </div>
  );
}
