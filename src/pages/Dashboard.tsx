import React, { useState, useEffect, useRef, useMemo } from "react";
import { UploadCloud, Link as LinkIcon, Shield, ExternalLink, FileText, X } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button } from "../components/ui/Button";
import { LinkRecord } from "../types";
import { PdfToImageViewer } from "../components/PdfToImageViewer";
import { generateSamplePdf } from "../lib/samplePdfGenerator";
import { safeJsonParse, safeStorage, idbStorage } from "../lib/utils";
import { getRealtimeAnalytics, getPdfAnalytics } from "../lib/analyticsStore";
import { auth } from "../lib/auth";

export function Dashboard() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [rawDomains, setRawDomains] = useState<any[]>([]);
  const stats = getRealtimeAnalytics();
  const [securedCountToday, setSecuredCountToday] = useState(stats.rawPdfCount);
  const [timeRestricted, setTimeRestricted] = useState("2 Hours");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    idbStorage.getVaultDomains().then(savedDomains => {
      setRawDomains(savedDomains);
    });
  }, []);

  useEffect(() => {
    // Keep count of secured links updated in real-time
    const currentStats = getRealtimeAnalytics();
    setSecuredCountToday(currentStats.rawPdfCount);
  }, [tick]);

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

  const getLinkStatus = (link: any) => {
    // 1. Check if the status is explicitly "Expired" or has reached fixed expiresAt
    if (link.status === "Expired") {
      return { status: "Expired", label: "Expired", color: "text-red-500 bg-red-500/10 border-red-500/20" };
    }

    if (link.expiresAt) {
      const expiresTime = new Date(link.expiresAt).getTime();
      const diffS = Math.max(0, Math.round((expiresTime - Date.now()) / 1000));
      if (diffS <= 0) {
        return { status: "Expired", label: "Expired", color: "text-red-500 bg-red-500/10 border-red-500/20" };
      }
    }

    // 2. See if there is a customer/buyer timer ticking or completed in localStorage
    const originalId = link.originalId || (link.id ? String(link.id).replace("vlt_", "") : "");
    
    const candidates = [
      `vault_expiry_${originalId}`,
      link.domainName ? `vault_expiry_${link.domainName}` : "",
      `vault_expiry_portal_${originalId}`,
      `vault_expiry_vlt_${originalId}`
    ].filter(Boolean);

    for (const key of candidates) {
      if (key) {
        const value = safeStorage.getItem(key);
        if (value) {
          const expiresTime = Number(value);
          const diffS = Math.max(0, Math.round((expiresTime - Date.now()) / 1000));
          if (diffS <= 0) {
            return { status: "Expired", label: "Expired", color: "text-red-500 bg-red-500/10 border-red-500/20" };
          } else {
            return { 
              status: "Active", 
              label: `Active (${formatSeconds(diffS)} remaining)`, 
              color: "text-vault-accent bg-vault-accent/10 border-vault-accent/20" 
            };
          }
        }
      }
    }

    // Default to Active if not started yet
    return { 
      status: "Active", 
      label: "Active link (Auto-expiry)", 
      color: "text-vault-accent bg-vault-accent/10 border-vault-accent/20" 
    };
  };

  const formatSeconds = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
  };

  useEffect(() => {
    const userEmail = auth.currentUser?.email;
    const filteredDomains = rawDomains.filter(d => {
      // If a user is logged in, only show their PDFs. If they upload without login, creator is "Current Creator".
      if (userEmail && d.creatorEmail) {
        return d.creatorEmail === userEmail;
      }
      return true;
    });

    const mappedDomains = filteredDomains.map((d: any) => ({
      id: `vlt_${d.id}`,
      originalId: d.id,
      domainName: d.name,
      assetName: d.originalFileName || d.name,
      buyerEmail: "pending_customer@example.com",
      expiresAt: (() => {
        try {
          if (d.createdAt) {
            const time = new Date(d.createdAt).getTime();
            if (!isNaN(time)) {
              const limit = d.timeRestricted ? parseTimeLimit(d.timeRestricted) : 7200;
              return new Date(time + limit * 1000).toISOString();
            }
          }
        } catch (e) {
          console.error(e);
        }
        return new Date(Date.now() + 7200000).toISOString();
      })(),
      status: "Active",
      ipTracking: "0 IPs Logged",
      fileData: d.fileData,
      timeRestricted: d.timeRestricted
    }));
    
    setLinks([...mappedDomains]);
  }, [tick, rawDomains]);

  const handleRevoke = async (linkId: string) => {
    if (linkId.startsWith('vlt_')) {
      const numericId = parseInt(linkId.replace('vlt_', ''), 10);
      const newDomains = rawDomains.filter((d: any) => d.id !== numericId);
      await idbStorage.saveVaultDomains(newDomains);
      setRawDomains(newDomains);
    } else {
      setLinks(prev => prev.filter(l => l.id !== linkId));
    }
  };

  const uploadPdfFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      // Determine link expiry display
      let expiryHours = 2;
      const lowerR = timeRestricted.toLowerCase();
      if (lowerR.includes("1 hour")) expiryHours = 1;
      else if (lowerR.includes("12 hours")) expiryHours = 12;
      else if (lowerR.includes("24 hours")) expiryHours = 24;
      else if (lowerR.includes("7 days")) expiryHours = 168;
      else if (lowerR.includes("no limit")) expiryHours = 87600; // ~10 years
      
      const newDomain = {
        id: Date.now(),
        name: file.name.replace(/\s+/g, "_").toLowerCase() + ".vault.link",
        creator: auth.currentUser?.email || "Current Creator",
        creatorEmail: auth.currentUser?.email,
        timeRestricted: timeRestricted,
        isPro: false,
        originalFileName: file.name,
        fileData: event.target?.result || null,
        createdAt: new Date().toISOString()
      };

      const newDomains = [newDomain, ...rawDomains];
      await idbStorage.saveVaultDomains(newDomains);
      setRawDomains(newDomains);

      setSecuredCountToday(prev => prev + 1);
      alert(`Success! Generated secure vault link for "${file.name}". Your buyer can now access pages as protected raster images.`);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.slice(-4).toLowerCase() === ".pdf")) {
      uploadPdfFile(file);
    } else {
      alert("Invalid format. Please drag or select a standard PDF document.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.slice(-4).toLowerCase() === ".pdf")) {
      uploadPdfFile(file);
    } else {
      alert("Invalid format. Please drop a valid PDF file.");
    }
  };

  // Helper to obtain PDF data for preview (creates realistic in-memory PDF for mock templates!)
  const getPreviewPdfData = (previewObj: any) => {
    if (!previewObj) return "";
    if (previewObj.fileData) return previewObj.fileData;

    const assetName = previewObj.assetName || "";

    // Generate smart mock content on the fly
    if (previewObj.id === "vlt_1a2b3c" || assetName.includes("Notion")) {
      return generateSamplePdf(
        "Mastering Notion Templates",
        "Notion Pro Guide",
        "Step-by-step workbook detailing relational rollups, sync blocks, and team workspaces."
      );
    } else if (previewObj.id === "vlt_4f5g6h" || assetName.includes("Crypto")) {
      return generateSamplePdf(
        "Crypto Trading Guide 2026",
        "DeFi Analyst Core",
        "Comprehensive notes outlining decentralized liquidity, volume tracking breakouts, and cross-chain mechanics."
      );
    } else {
      return generateSamplePdf(
        assetName || "Secured Archive Source",
        "Verified Creator",
        "Auto-generated PDF document secure payload processed through VAULT's dynamic screenshot shield."
      );
    }
  };

  return (
    <DashboardLayout>
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-vault-card border border-vault-border rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-vault-border bg-[#151515]">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-vault-accent" />
                <div>
                  <h3 className="text-white font-medium text-base">{previewFile.assetName}</h3>
                  <p className="text-xs text-vault-gray flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-vault-accent" /> Creator Security Audit Preview (Watermarked Screens-Shield View)
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)} className="h-8 w-8 text-vault-gray hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Interactive Viewer Viewport */}
            <div className="flex-1 bg-black/60 p-6 overflow-y-auto flex items-center justify-center relative">
              <div className="w-full h-full max-w-5xl flex flex-col">
                <div className="mb-4 bg-vault-card border border-vault-border rounded-xl p-3 text-xs text-vault-gray flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-vault-accent" />
                  <span>The buyer will see this file as static raster pages. Copying text, printing, or sniffing raw frames is disabled.</span>
                </div>
                
                <div className="flex-1 bg-[#101010] border-2 border-[#dc1717] rounded-xl p-4 flex items-center justify-center overflow-auto min-h-[400px]">
                  {previewFile.assetName.endsWith(".zip") ? (
                    <div className="text-center p-12 space-y-3 max-w-md">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <h4 className="text-white font-semibold">ZIP Container Asset</h4>
                      <p className="text-xs text-vault-gray leading-relaxed">
                        Security image rasterization is exclusive to PDF documents. ZIP archives are secured containing raw encrypted bytes available via direct access only.
                      </p>
                    </div>
                  ) : (
                    <PdfToImageViewer 
                      pdfDataUrl={getPreviewPdfData(previewFile)} 
                      buyerEmail={previewFile.buyerEmail || "preview@vault.com"} 
                      ipAddress="127.0.0.1 (Self)" 
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Creator Dashboard</h1>
        <p className="text-vault-gray">Secure your assets and track your deliveries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Zone */}
        <div className="lg:col-span-2">
          <div className="bg-vault-card border border-vault-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Quick Protect</h2>
            <div 
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                isDragActive ? "border-vault-accent bg-vault-accent/5" : "border-vault-border hover:border-vault-gray/50 bg-black/20"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="w-12 h-12 text-vault-accent mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-white mb-2">Upload Digital Asset</h3>
              <p className="text-vault-gray text-sm mb-6">Drag & drop your PDF file here, or click to browse</p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="application/pdf" 
                className="hidden" 
                onChange={handleFileSelect} 
              />
              <Button>Select PDF File & Generate Secure Link</Button>
            </div>

            <div className="mt-6 border-t border-vault-border/55 pt-6">
              <label className="block text-sm font-medium text-vault-gray mb-3">Link Lifespan / Time Restriction</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {["1 Hour", "2 Hours", "12 Hours", "24 Hours", "7 Days", "No Limit"].map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setTimeRestricted(option)}
                    className={`py-2 px-1 rounded-lg text-[11px] font-semibold tracking-tight transition-all border cursor-pointer text-center ${
                      timeRestricted === option 
                        ? "bg-vault-accent text-black border-vault-accent hover:bg-vault-accent/90" 
                        : "bg-black/40 text-vault-gray border-vault-border/70 hover:text-white"
                    }`}
                  >
                    ⏱ {option}
                  </button>
                ))}
              </div>
              <p className="text-xs text-vault-gray mt-2 leading-relaxed">
                The chosen expiration countdown applies to all client accesses generated using this zone.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats or Actions */}
        <div className="space-y-6">
          <div className="bg-vault-card border border-vault-border rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Overview Analytics</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-vault-gray uppercase font-semibold tracking-wider">Total PDFs / Links</p>
                <p className="text-2xl font-display font-bold text-white mt-1">{securedCountToday}</p>
              </div>
              <div>
                <p className="text-xs text-vault-gray uppercase font-semibold tracking-wider">Active Links</p>
                <p className="text-2xl font-display font-bold text-vault-accent mt-1">{stats.activeLinks}</p>
              </div>
              <div>
                <p className="text-xs text-vault-gray uppercase font-semibold tracking-wider">Expired Links</p>
                <p className="text-2xl font-display font-bold text-red-500 mt-1">{stats.expiredLinks}</p>
              </div>
              <div>
                <p className="text-xs text-vault-gray uppercase font-semibold tracking-wider">Last Accessed</p>
                <p className="text-sm font-display font-bold text-white mt-1 truncate max-w-[120px]">
                  {stats.allLogs && stats.allLogs.length > 0 ? stats.allLogs[0].assetName : "None"}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-vault-border text-xs text-vault-gray">
              <p className="flex justify-between items-center mb-1">
                <span>Recently Uploaded:</span>
                <span className="text-white truncate max-w-[150px]">{links.length > 0 ? links[0].assetName : "None"}</span>
              </p>
              <p className="flex justify-between items-center">
                <span>Recently Expired:</span>
                <span className="text-red-400 truncate max-w-[150px]">
                  {links.find(l => getLinkStatus(l).status === "Expired")?.assetName || "None"}
                </span>
              </p>
            </div>
          </div>
          
          <div className="bg-vault-card border border-vault-border rounded-xl p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-vault-border pb-2">Real-Time Activity Monitor</h3>
            <div className="text-xs text-vault-gray space-y-3 leading-relaxed max-h-48 overflow-y-auto">
              {stats.allLogs && stats.allLogs.length > 0 ? (
                stats.allLogs.slice(0, 10).map((log, index) => (
                  <p key={index} className="flex gap-2.5">
                    <span className={log.action === "Access" ? "text-vault-accent" : (log.action === "Failed Authorization" ? "text-red-500" : "text-blue-400")}>
                      {log.action === "Access" ? "✓" : (log.action === "Failed Authorization" ? "⚠" : "▶")}
                    </span>
                    <span>
                      <span className="text-white font-medium">{log.email}</span> {log.action === "Access" ? "accessed" : "interacted with"} <span className="text-white">{log.assetName}</span>
                      <span className="block text-[10px] text-vault-gray/70">{new Date(log.timestamp).toLocaleString()} • IP: {log.ip}</span>
                    </span>
                  </p>
                ))
              ) : (
                <p className="text-center text-vault-gray/60 italic">No recent activity detected.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Links Table */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">All Uploaded PDFs & Generated Links</h2>
          <Button variant="ghost" size="sm" className="text-vault-gray hover:text-white">View All</Button>
        </div>
        
        <div className="bg-vault-card border border-vault-border rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1a1a1a] border-b border-vault-border text-vault-gray font-semibold">
              <tr>
                <th className="py-4 px-6 font-medium">Asset Name</th>
                <th className="py-4 px-6 font-medium">Buyer Email</th>
                <th className="py-4 px-6 font-medium">Expiry / Status</th>
                <th className="py-4 px-6 font-medium font-semibold">Access / Clicks</th>
                <th className="py-4 px-6 font-medium">Unique IPs Logged</th>
                <th className="py-4 px-6 font-medium text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vault-border text-sm">
              {links.map(link => {
                const statusInfo = getLinkStatus(link);
                const isExpired = statusInfo.status === "Expired";
                // Get real time analytics data for this specific PDF asset
                const linkStats = getPdfAnalytics(link.originalId || link.id.replace("vlt_", ""));
                return (
                  <tr key={link.id} className="hover:bg-vault-bg/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-white flex items-center gap-2">
                      <LinkIcon className={`w-4 h-4 shrink-0 ${isExpired ? "text-red-400" : "text-vault-gray"}`} />
                      <span className={`truncate max-w-[120px] sm:max-w-[150px] ${isExpired ? "text-vault-gray line-through" : "text-white"}`}>{link.assetName}</span>
                      <button 
                        onClick={() => setPreviewFile(link)}
                        className={`ml-2 p-1.5 rounded transition-colors cursor-pointer ${
                          isExpired 
                            ? "text-red-400 hover:text-white hover:bg-red-500/20" 
                            : "text-vault-accent hover:text-white hover:bg-vault-accent/20"
                        }`}
                        title="Preview Document Pages as Images"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                    <td className={`py-4 px-6 ${isExpired ? "text-vault-gray/60" : "text-vault-gray"}`}>{link.buyerEmail}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded inline-flex items-center gap-1.5 font-semibold text-xs border uppercase tracking-wider ${statusInfo.color}`}>
                        {isExpired ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Expired
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-vault-accent" />
                            {statusInfo.label}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase inline-flex items-center w-fit gap-1 ${
                          link.assetName.endsWith(".zip") 
                            ? "bg-amber-500/10 text-amber-500" 
                            : "bg-vault-accent/10 text-vault-accent"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${link.assetName.endsWith(".zip") ? "bg-amber-400" : "bg-vault-accent"}`} />
                          {linkStats.views} {linkStats.views === 1 ? 'Open' : 'Opens'}
                        </span>
                        <span className="text-[10px] text-vault-gray font-mono pl-1">
                          {linkStats.totalClicks} interaction clicks
                        </span>
                      </div>
                    </td>
                    <td className={`py-4 px-6 text-xs font-mono ${isExpired ? "text-red-400/80" : "text-vault-gray"}`}>
                      {isExpired ? "Blocked (Expired)" : `${linkStats.uniqueIps?.length || 0} Viewer IP(s)`}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button 
                        variant={isExpired ? "secondary" : "outline"} 
                        size="sm" 
                        disabled={isExpired}
                        onClick={() => handleRevoke(link.id)} 
                        className={`h-8 py-0 px-3 text-xs ${isExpired ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        {isExpired ? "Closed" : "Revoke Access"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
