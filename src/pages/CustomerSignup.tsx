import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, FileText, Lock, Unlock, ShieldAlert } from "lucide-react";
import { Button } from "../components/ui/Button";
import { initAuth, googleSignIn, logout } from "../lib/auth";
import { motion } from "motion/react";
import { AnimatedBackground } from "../components/ui/AnimatedBackground";
import { PdfToImageViewer } from "../components/PdfToImageViewer";
import { generateSamplePdf } from "../lib/samplePdfGenerator";
import { safeJsonParse, safeStorage, idbStorage } from "../lib/utils";


export function CustomerSignup() {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium">("free");
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds
  const [tick, setTick] = useState(0);

  // Trigger re-render every second to update countdowns in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const parseTimeLimit = (limitStr: string): number => {
    const lower = (limitStr || "2 Hours").toLowerCase();
    
    // Check for any numbers followed by a unit
    const numMatch = lower.match(/(\d+)/);
    if (numMatch) {
      const value = parseInt(numMatch[1], 10);
      if (lower.includes("sec")) return value;
      if (lower.includes("min")) return value * 60;
      if (lower.includes("hour") || lower.includes("hr")) return value * 3600;
      if (lower.includes("day")) return value * 86400;
      return value * 3600;
    }
    
    if (lower.includes("no limit")) return 315360000; // ~10 years
    return 7200; // default 2 hours
  };

  const getDomainAccessState = (domain: any) => {
    const storageKey = `vault_expiry_${domain.id || domain.name}`;
    const savedExpiry = safeStorage.getItem(storageKey);
    
    if (!savedExpiry) {
      return { expired: false, started: false, timeLeftSeconds: 0 };
    }
    
    const expiryTime = Number(savedExpiry);
    const timeLeftS = Math.max(0, Math.round((expiryTime - Date.now()) / 1000));
    
    if (timeLeftS <= 0) {
      return { expired: true, started: true, timeLeftSeconds: 0 };
    }
    
    return { expired: false, started: true, timeLeftSeconds: timeLeftS };
  };

  // Helper to obtain PDF data for preview (creates realistic in-memory PDF for mock templates!)
  const getPreviewPdfData = (previewObj: any) => {
    if (!previewObj) return "";
    if (previewObj.fileData) return previewObj.fileData;

    // Generate smart mock content on the fly
    if (previewObj.id === 2 || previewObj.name?.includes("notion")) {
      return generateSamplePdf(
        "Mastering Notion Templates",
        "Notion Pro Guide",
        "Step-by-step workbook detailing relational rollups, sync blocks, and team workspaces."
      );
    } else if (previewObj.id === 1 || previewObj.name?.includes("crypto")) {
      return generateSamplePdf(
        "Crypto Trading Guide 2026",
        "DeFi Analyst Core",
        "Comprehensive notes outlining decentralized liquidity, volume tracking breakouts, and cross-chain mechanics."
      );
    } else {
      return generateSamplePdf(
        previewObj.originalFileName || previewObj.name || "Secured Archive Source",
        "Verified Creator",
        "Auto-generated PDF document secure payload processed through VAULT's dynamic screenshot shield."
      );
    }
  };

  useEffect(() => {
    logout();
    const unsubscribe = initAuth((user) => {
      setIsGoogleConnected(true);
      setUserEmail(user.email);
    }, () => {
      setIsGoogleConnected(false);
      setUserEmail(null);
    });
    return () => unsubscribe();
  }, []);

  const [domains, setDomains] = useState<any[]>([]);

  useEffect(() => {
    idbStorage.getVaultDomains().then(saved => setDomains(saved));
  }, []);

  const handleConnectGmail = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const { user } = await googleSignIn();
      setIsGoogleConnected(true);
      setUserEmail(user.email);
    } catch (err: any) {
      console.error("Failed to connect Gmail", err);
      if (err?.code === 'auth/unauthorized-domain') {
        alert("Configuration Error: This domain is not authorized for OAuth operations in your Firebase project. Please add this preview URL to your Firebase Console > Authentication > Settings > Authorized Domains.");
      } else {
        alert("Authentication failed. Please try again.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (previewFile) {
      const storageKey = `vault_expiry_${previewFile.id || previewFile.name}`;
      const savedExpiry = safeStorage.getItem(storageKey);
      let expiryTime = 0;

      if (savedExpiry) {
        expiryTime = Number(savedExpiry);
      } else {
        // Parse actual configured file limit dynamically!
        const limitSeconds = parseTimeLimit(previewFile.timeRestricted || "2 Hours");
        expiryTime = Date.now() + limitSeconds * 1000;
        safeStorage.setItem(storageKey, String(expiryTime));
      }

      const getRemaining = () => Math.max(0, Math.round((expiryTime - Date.now()) / 1000));
      setTimeLeft(getRemaining());

      const timer = setInterval(() => {
        const remaining = getRemaining();
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
          setPreviewFile(null); // Automatically CLOSE the preview modal immediately when time limit ends!
          alert(`Access time limit reached. The document "${previewFile?.originalFileName || previewFile.name}" has expired and is now secured.`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [previewFile]);

  const handleAccess = (domain: any) => {
    // Proactively pre-request camera permission on direct user interaction (gesture context)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          // Immediately stop tracks of this short pre-request; the permission is now fully cached for PdfToImageViewer!
          stream.getTracks().forEach(track => track.stop());
        })
        .catch((err) => {
          console.warn("Proactive camera prompt skipped or rejected:", err);
        });
    }
    
    // Import and fire analytics tracking when they successfully access!
    import("../lib/analyticsStore").then(({ trackPdfAccess }) => {
      const cleanId = String(domain.id).replace("vlt_", "");
      trackPdfAccess(cleanId, userEmail || undefined, "192.168.1.107");
    });
    
    setPreviewFile(domain);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-vault-bg flex flex-col items-center justify-start py-8 sm:py-12 p-4 relative overflow-hidden select-none">
      <AnimatedBackground />

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-vault-card border border-vault-border rounded-xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden relative z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-vault-border bg-[#1a1a1a]">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-vault-accent" />
                <div>
                  <h3 className="text-white font-medium">Secure Content: {previewFile?.originalFileName || previewFile.name}</h3>
                  <p className="text-xs text-vault-gray flex items-center gap-1">
                    <Shield className="w-3 h-3 text-vault-accent" /> Accessed via Google Drive Integrations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-red-500/10 border border-red-500/20 px-3 py-1 rounded text-red-400 font-mono text-sm flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  {formatTime(timeLeft)}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPreviewFile(null)}>
                  Close Preview
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-white/5 flex items-center justify-center p-4 sm:p-8 overflow-hidden relative group">
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                  <Shield className="w-96 h-96 text-vault-accent" />
                </div>
                <div className="w-full h-full max-w-5xl bg-[#101010] border border-vault-border rounded-xl shadow-xl overflow-y-auto p-4 text-white relative z-10 transition-transform flex flex-col justify-start">
                  {timeLeft === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                      <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
                      <h2 className="text-3xl font-bold text-white mb-3">Access Expired</h2>
                      <p className="text-vault-gray max-w-md">Your 2-hour access window for this document has permanently closed. The creator's file is now secured.</p>
                    </div>
                  ) : (
                    <PdfToImageViewer 
                      pdfDataUrl={getPreviewPdfData(previewFile)} 
                      buyerEmail={userEmail || "secured_customer@vault.com"} 
                      ipAddress="192.168.1.107"
                      onInteraction={() => {
                        import("../lib/analyticsStore").then(({ trackPdfClick }) => {
                          const cleanId = String(previewFile?.id).replace("vlt_", "");
                          trackPdfClick(cleanId, userEmail || undefined, "192.168.1.107");
                        });
                      }}
                    />
                  )}
                </div>
            </div>
          </motion.div>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="w-full max-w-5xl relative z-10"
      >
        <div className="mb-12 flex items-center gap-3">
          <Link to="/">
            <Shield className="h-8 w-8 text-vault-accent hover:drop-shadow-[0_0_10px_rgba(0,255,189,0.8)] transition-all" />
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">Customer Sign Up & Access</h1>
        </div>

        {!isGoogleConnected ? (
          <div className="max-w-md mx-auto relative mt-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-vault-accent/30 to-vault-border content-[''] pointer-events-none" />
            <div className="relative bg-vault-card rounded-3xl p-8 backdrop-blur-xl border border-vault-border/50 text-center shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-2">Access Secure Files</h2>
              <p className="text-vault-gray text-sm mb-8 leading-relaxed">Connect your Gmail and Google Drive to securely view timed-access PDFs directly from creators.</p>
              <Button 
                size="lg" 
                onClick={handleConnectGmail} 
                disabled={isConnecting}
                className="w-full bg-white hover:bg-gray-200 text-black border-none flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <div className="w-5 h-5 mr-3 flex items-center justify-center bg-[#4285F4] rounded text-white text-xs font-bold font-sans">G</div>
                {isConnecting ? "Connecting..." : "Connect Gmail & Drive"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-6 justify-between items-center bg-vault-card p-6 md:p-8 rounded-2xl border border-vault-border">
              <div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">Select Your Access Plan</h2>
                <p className="text-vault-gray text-sm max-w-md">Upgrade to Premier to unlock extended viewing times and access to premium-only domains.</p>
              </div>
              <div className="flex p-1.5 bg-[#1a1a1a] rounded-xl border border-vault-border/50 w-full sm:w-auto">
                <button 
                  onClick={() => setSelectedPlan("free")}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer ${selectedPlan === "free" ? "bg-vault-card text-white shadow-lg border border-vault-border" : "text-vault-gray hover:text-white"}`}
                >
                  Free Plan
                </button>
                <button 
                  onClick={() => setSelectedPlan("premium")}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${selectedPlan === "premium" ? "bg-vault-accent text-black shadow-[0_0_15px_rgba(0,255,189,0.3)]" : "text-vault-gray hover:text-white"}`}
                >
                  Premier <Unlock className="w-3.5 h-3.5 animate-pulse" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Available Domains</h3>
                <span className="text-sm text-vault-accent bg-vault-accent/10 px-3 py-1 rounded-full border border-vault-accent/20">Google Drive Linked</span>
              </div>
              <div className="bg-vault-card border border-vault-border rounded-xl hidden md:block overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#1a1a1a] border-b border-vault-border text-vault-gray">
                    <tr>
                      <th className="py-5 px-6 font-medium">Domain / Document Route</th>
                      <th className="py-5 px-6 font-medium">Creator Name</th>
                      <th className="py-5 px-6 font-medium">Time Restricted</th>
                      <th className="py-5 px-6 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-vault-border">
                    {domains.map(domain => {
                      const state = getDomainAccessState(domain);
                      const isEmailUnauthorized = domain.allowedEmails && domain.allowedEmails.length > 0 && (!userEmail || !domain.allowedEmails.includes(userEmail.trim().toLowerCase()));
                      const isLocked = (domain.isPro && selectedPlan === "free") || isEmailUnauthorized;
                      return (
                        <tr key={domain.id} className="hover:bg-[#1a1a1a] transition-colors group">
                          <td className="py-5 px-6 font-medium text-white flex items-center gap-3">
                            <div className="p-2 bg-vault-border/50 rounded flex items-center justify-center group-hover:bg-vault-accent/20 transition-all duration-300">
                              <Lock className="w-4 h-4 text-vault-accent" />
                            </div>
                            {domain.name}
                            {domain.isPro && selectedPlan === "free" && (
                              <span className="ml-3 px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase tracking-wider">Premier Only</span>
                            )}
                          </td>
                          <td className="py-5 px-6 text-vault-gray">{domain.creator}</td>
                          <td className="py-5 px-6 font-mono font-medium">
                            {state.expired ? (
                              <span className="text-red-500 font-semibold flex items-center gap-1.5 bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20 w-fit">
                                <ShieldAlert className="w-3.5 h-3.5" /> Expired
                              </span>
                            ) : state.started ? (
                              <span className="text-vault-accent font-semibold flex items-center gap-1.5 bg-vault-accent/10 px-2.5 py-1 rounded border border-vault-accent/20 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-vault-accent animate-pulse" />
                                {formatTime(state.timeLeftSeconds)} remaining
                              </span>
                            ) : (
                              <span className="text-vault-gray flex items-center gap-1.5">
                                ⏱ {domain.timeRestricted}
                              </span>
                            )}
                          </td>
                          <td className="py-5 px-6 text-right">
                            {isLocked ? (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled
                                className="w-32 bg-white/5 text-vault-gray border border-white/10"
                              >
                                {isEmailUnauthorized ? "Unauthorized" : "Locked"}
                              </Button>
                            ) : state.expired ? (
                              <Button 
                                variant="danger" 
                                size="sm"
                                disabled
                                className="w-32 bg-red-950/20 text-red-400 border border-red-500/10 cursor-not-allowed opacity-60 hover:scale-100 hover:-translate-y-0"
                              >
                                Expired
                              </Button>
                            ) : (
                              <Button 
                                variant={state.started ? "primary" : "outline"}
                                size="sm"
                                onClick={() => handleAccess(domain)}
                                className="w-32 cursor-pointer"
                              >
                                {state.started ? "Resume PDF" : "Access PDF"}
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile View */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                 {domains.map(domain => {
                    const state = getDomainAccessState(domain);
                    const isEmailUnauthorized = domain.allowedEmails && domain.allowedEmails.length > 0 && (!userEmail || !domain.allowedEmails.includes(userEmail.trim().toLowerCase()));
                    const isLocked = (domain.isPro && selectedPlan === "free") || isEmailUnauthorized;
                    return (
                      <div key={domain.id} className="bg-vault-card border border-vault-border rounded-xl p-5 shadow-lg">
                         <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2 font-medium text-white break-all">
                               <Lock className="w-4 h-4 text-vault-accent shrink-0" />
                               <span>{domain.name}</span>
                            </div>
                            {domain.isPro && selectedPlan === "free" && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase tracking-wider shrink-0 mt-1">Premier</span>
                            )}
                         </div>
                         <div className="flex justify-between items-center text-sm text-vault-gray mb-4">
                            <span>Creator: {domain.creator}</span>
                            <div>
                              {state.expired ? (
                                <span className="text-red-500 font-semibold font-mono text-xs flex items-center gap-1.5 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                  Expired
                                </span>
                              ) : state.started ? (
                                <span className="text-vault-accent font-semibold font-mono text-xs flex items-center gap-1 bg-vault-accent/10 px-2 py-0.5 rounded border border-vault-accent/20">
                                  {formatTime(state.timeLeftSeconds)}
                                </span>
                              ) : (
                                <span className="text-vault-gray font-mono text-xs">
                                  ⏱ {domain.timeRestricted}
                                </span>
                              )}
                            </div>
                         </div>
                         {isLocked ? (
                           <Button 
                              variant="ghost" 
                              size="md"
                              className="w-full text-sm"
                              disabled
                            >
                              {isEmailUnauthorized ? "Locked (Unauthorized Gmail)" : "Locked (Requires Premier)"}
                            </Button>
                         ) : state.expired ? (
                           <Button 
                              variant="danger" 
                              size="md"
                              className="w-full text-sm bg-red-950/20 text-red-500 border border-red-500/10 cursor-not-allowed opacity-60 hover:scale-100 hover:-translate-y-0"
                              disabled
                            >
                              Expired
                            </Button>
                         ) : (
                           <Button 
                              variant={state.started ? "primary" : "outline"} 
                              size="md"
                              className="w-full text-sm cursor-pointer"
                              onClick={() => handleAccess(domain)}
                            >
                              {state.started ? "Resume PDF Access" : "Access PDF Domain"}
                            </Button>
                         )}
                      </div>
                    );
                 })}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
