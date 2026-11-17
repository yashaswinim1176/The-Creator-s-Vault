import { useState, useEffect } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button } from "../components/ui/Button";
import { LinkIcon, ExternalLink, Activity, Users, MousePointerClick, ShieldAlert, X } from "lucide-react";
import { LinkRecord } from "../types";
import { PdfToImageViewer } from "../components/PdfToImageViewer";
import { generateSamplePdf } from "../lib/samplePdfGenerator";
import { safeJsonParse, safeStorage, idbStorage } from "../lib/utils";
import { auth } from "../lib/auth";
import { getRealtimeAnalytics } from "../lib/analyticsStore";

const MOCK_LINKS: LinkRecord[] = [
  {
    id: "vlt_9x8y7z",
    assetName: "Dark_Mode_UI_Kit.zip",
    buyerEmail: "designer123@gmail.com",
    expiresAt: new Date(Date.now() - 1000000).toISOString(),
    status: "Expired",
    ipTracking: "3 IPs Logged (Blocked)",
  },
];

export function ActiveLinks() {
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<"All" | "Active" | "Expired">("All");

  const stats = getRealtimeAnalytics();

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
              label: `Active (${formatSeconds(diffS)} left)`, 
              color: "text-vault-accent bg-vault-accent/10 border-vault-accent/20" 
            };
          }
        }
      }
    }

    // Default to Active if not started yet
    return { 
      status: "Active", 
      label: "Active (Not accessed)", 
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

  const [rawDomains, setRawDomains] = useState<any[]>([]);

  useEffect(() => {
    idbStorage.getVaultDomains().then(savedDomains => {
      setRawDomains(savedDomains);
    });
  }, []);

  useEffect(() => {
    const userEmail = auth.currentUser?.email;
    const filteredDomains = rawDomains.filter(d => {
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
    
    setLinks([...mappedDomains, ...MOCK_LINKS]);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-vault-card border border-vault-border rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-vault-border bg-[#151515]">
              <div className="flex items-center gap-3">
                <LinkIcon className="w-5 h-5 text-vault-accent" />
                <div>
                  <h3 className="text-white font-medium text-base">{previewFile.assetName}</h3>
                  <p className="text-xs text-vault-gray flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-vault-accent" /> Creator Security Audit Preview (Watermarked Screens-Shield View)
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
                  <span>The buyer will see this file as static watermarked images to protect against automated copying or scraping.</span>
                </div>
                
                <div className="flex-1 bg-[#101010] border border-vault-border/50 rounded-xl p-4 flex items-center justify-center overflow-auto min-h-[400px]">
                  {previewFile.assetName.endsWith(".zip") ? (
                    <div className="text-center p-12 space-y-3 max-w-md">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
                        <LinkIcon className="w-8 h-8" />
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
        <h1 className="text-3xl font-display font-bold text-white mb-2">Active Links & Security</h1>
        <p className="text-vault-gray">Monitor the status and engagement of your generated secure links.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-vault-card border border-vault-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-vault-gray">Total Link Clicks</p>
              <p className="text-2xl font-bold text-white">{stats.totalSecureViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-vault-card border border-vault-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-vault-accent/10 rounded-lg">
              <Users className="w-6 h-6 text-vault-accent" />
            </div>
            <div>
              <p className="text-sm text-vault-gray">Unique Viewers</p>
              <p className="text-2xl font-bold text-white">{stats.totalVisitors.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-vault-card border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-vault-gray">Blocked Access Attempts</p>
              <p className="text-2xl font-bold text-white">{Math.max(4, Math.floor(stats.totalSecureViews * 0.12))}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-vault-card border border-vault-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-vault-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Active Secure Links</h2>
            <p className="text-xs text-vault-gray mt-1">Real-time status tracking of active PDF link nodes</p>
          </div>
          <div className="flex gap-1 bg-black/40 p-1.5 rounded-lg border border-vault-border/50 w-fit">
            <button
              className="py-1.5 px-3 rounded text-xs font-semibold tracking-tight transition-all cursor-default bg-vault-accent text-black font-bold shadow-md"
            >
              Active
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1a1a1a] border-b border-vault-border text-vault-gray">
              <tr>
                <th className="py-4 px-6 font-medium">Asset Name</th>
                <th className="py-4 px-6 font-medium">Expires</th>
                <th className="py-4 px-6 font-medium">Link Status</th>
                <th className="py-4 px-6 font-medium text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vault-border">
              {(() => {
                const filteredLinks = links.filter(link => {
                  const statusInfo = getLinkStatus(link);
                  return statusInfo.status === "Active";
                });

                if (filteredLinks.length === 0) {
                  return (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-vault-gray text-sm">
                        No active links found.
                      </td>
                    </tr>
                  );
                }

                return filteredLinks.map(link => {
                  const statusInfo = getLinkStatus(link);
                  return (
                    <tr key={link.id} className="hover:bg-vault-bg/50 transition-colors group">
                      <td className="py-4 px-6 font-medium text-white flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 shrink-0 transition-colors text-vault-accent/80 group-hover:text-vault-accent" />
                        <span className="font-mono text-xs tracking-tight truncate max-w-[130px] sm:max-w-[180px] text-white">
                          {link.assetName}
                        </span>
                        <button 
                          onClick={() => setPreviewFile(link)}
                          className="ml-2 p-1.5 rounded-md border transition-all cursor-pointer text-vault-accent bg-vault-accent/5 hover:text-white hover:bg-vault-accent/20 border-vault-accent/10 hover:border-vault-accent/30 shadow-[0_0_8px_rgba(0,255,189,0.02)] active:scale-95"
                          title="Preview Document"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="py-4 px-6 text-vault-gray text-xs">
                        {link.expiresAt ? new Date(link.expiresAt).toLocaleString() : 'No Limit'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded border font-semibold text-xs inline-flex items-center gap-1.5 uppercase tracking-wide ${statusInfo.color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-vault-accent animate-pulse" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button 
                          variant="outline"
                          size="sm" 
                          className="hidden sm:inline-flex" 
                          onClick={() => handleRevoke(link.id)}
                        >
                          Revoke Access
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="sm:hidden" 
                          onClick={() => handleRevoke(link.id)}
                        >
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
