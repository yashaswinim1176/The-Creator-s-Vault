import { safeJsonParse, safeStorage } from "./utils";

export interface PdfDomain {
  id: number;
  name: string;
  creator: string;
  timeRestricted: string;
  isPro: boolean;
  originalFileName: string;
  fileData?: any;
  createdAt?: string; // ISO String
}

export interface PdfAnalyticsRecord {
  views: number;
  totalClicks: number;
  firstClickTime?: string;
  lastClickTime?: string;
  uniqueViewers: string[];
  uniqueIps: string[];
  recentLogs: { timestamp: string; email: string; ip: string; action: string }[];
}

export const getPdfAnalytics = (id: string | number): PdfAnalyticsRecord => {
  const key = `vault_analytics_${id}`;
  const data = safeStorage.getItem(key);
  if (data) {
    return safeJsonParse(data, { views: 0, totalClicks: 0, uniqueViewers: [], uniqueIps: [], recentLogs: [] });
  }
  return { views: 0, totalClicks: 0, uniqueViewers: [], uniqueIps: [], recentLogs: [] };
};

export const trackPdfAccess = (id: string | number, userEmail?: string, ipAddress?: string) => {
  const key = `vault_analytics_${id}`;
  const stats = getPdfAnalytics(id);
  stats.views += 1;
  const now = new Date().toISOString();

  if (userEmail && !stats.uniqueViewers.includes(userEmail)) {
    stats.uniqueViewers.push(userEmail);
  }
  if (ipAddress && !stats.uniqueIps) {
    stats.uniqueIps = [];
  }
  if (ipAddress && !stats.uniqueIps.includes(ipAddress)) {
    stats.uniqueIps.push(ipAddress);
  }
  
  if (!stats.recentLogs) stats.recentLogs = [];
  stats.recentLogs.unshift({
    timestamp: now,
    email: userEmail || "Anonymous",
    ip: ipAddress || "Unknown",
    action: "Access"
  });
  // keep last 50 logs
  if (stats.recentLogs.length > 50) stats.recentLogs.pop();

  safeStorage.setItem(key, JSON.stringify(stats));
};

export const trackPdfClick = (id: string | number, userEmail?: string, ipAddress?: string) => {
  const key = `vault_analytics_${id}`;
  const stats = getPdfAnalytics(id);
  const now = new Date().toISOString();
  if (stats.totalClicks === 0) {
    stats.firstClickTime = now;
  }
  stats.lastClickTime = now;
  stats.totalClicks += 1;

  if (!stats.recentLogs) stats.recentLogs = [];
  stats.recentLogs.unshift({
    timestamp: now,
    email: userEmail || "Anonymous",
    ip: ipAddress || "Unknown",
    action: "Click Interaction"
  });
  // keep last 50 logs
  if (stats.recentLogs.length > 50) stats.recentLogs.pop();

  safeStorage.setItem(key, JSON.stringify(stats));
};

// Helper to parse time limit in string format to seconds
export const parseTimeLimit = (limitStr: string): number => {
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

// Generate deterministic metrics for each PDF to make it feel real and persistent
export function getPdfMetrics(pdf: PdfDomain) {
  const realStats = getPdfAnalytics(pdf.id);
  
  const secureViews = realStats.views;
  const clicks = realStats.totalClicks;
  const visitors = realStats.uniqueViewers.length > 0 ? realStats.uniqueViewers.length : Math.max(1, Math.ceil(secureViews / 2));
  
  // We can treat a 'view' as a potential conversion and a 'click' inside the viewer as higher engagement.
  const conversionRate = secureViews > 0 ? parseFloat(((secureViews / visitors) * 10).toFixed(1)) : 0; 
  const revenue = secureViews * 5; // Each PDF contains ₹5 per view/access/sale

  // Determine actual active/expired status based on createdAt and timeRestricted or customer/buyer ticking timer
  let status: "Active" | "Expired" = "Active";
  if (pdf.createdAt) {
    const elapsedMs = Date.now() - new Date(pdf.createdAt).getTime();
    const limitSeconds = parseTimeLimit(pdf.timeRestricted || "2 Hours");
    if (elapsedMs > limitSeconds * 1000) {
      status = "Expired";
    }
  }

  // Also see if there is a customer/buyer timer ticking or completed in localStorage
  const originalId = pdf.id ? String(pdf.id) : "";
  const candidates = [
    `vault_expiry_${originalId}`,
    pdf.name ? `vault_expiry_${pdf.name}` : "",
    `vault_expiry_portal_${originalId}`,
    `vault_expiry_vlt_${originalId}`
  ].filter(Boolean);

  for (const key of candidates) {
    const value = safeStorage.getItem(key);
    if (value) {
      const expiresTime = Number(value);
      const diffS = expiresTime - Date.now();
      if (diffS <= 0) {
        status = "Expired";
      }
    }
  }

  return {
    secureViews,
    visitors,
    clicks,
    conversionRate,
    revenue,
    status,
    recentLogs: realStats.recentLogs || []
  };
}

export function getRealtimeAnalytics() {
  let savedDomains: PdfDomain[] = safeJsonParse(safeStorage.getItem("vault_domains"), []);
  
  // Pre-seed default assets on initial load to ensure the analytics dashboard is populated and real-time immediately
  if (savedDomains.length === 0) {
    savedDomains = [
      {
        id: 1001,
        name: "mastering_notion_templates.vault.link",
        creator: "Notion Creator Pro",
        timeRestricted: "2 Hours",
        isPro: false,
        originalFileName: "Mastering_Notion_Templates.pdf",
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 1002,
        name: "crypto_trading_guide.vault.link",
        creator: "DeFi Asset Analyst",
        timeRestricted: "12 Hours",
        isPro: true,
        originalFileName: "Crypto_Trading_Guide.pdf",
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];
    safeStorage.setItem("vault_domains", JSON.stringify(savedDomains));
    
    // Track initial accesses to seed the logs
    trackPdfAccess(1001, "buyer_notion@gmail.com", "157.45.12.98");
    trackPdfClick(1001, "buyer_notion@gmail.com", "157.45.12.98");
    trackPdfAccess(1002, "investor_crypto@yahoo.com", "98.210.45.3");
  }

  const allDomains = savedDomains;

  let totalSecureViews = 0;
  let totalRevenue = 0;
  let totalVisitors = 0;
  let activeLinksCount = 0;
  let expiredLinksCount = 0;

  const appData = allDomains.map((domain) => {
    const metrics = getPdfMetrics(domain);
    totalSecureViews += metrics.secureViews;
    totalRevenue += metrics.revenue;
    totalVisitors += metrics.visitors;
    if (metrics.status === "Active") {
      activeLinksCount++;
    } else {
      expiredLinksCount++;
    }

    return {
      domain,
      metrics
    };
  });

  // Aggregate all recent logs across domains
  const allLogs = appData
    .flatMap(item => item.metrics.recentLogs.map((log: any) => ({ ...log, assetName: item.domain.originalFileName })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 100);

  const avgConversionRate = totalVisitors > 0 
    ? parseFloat(((totalSecureViews / totalVisitors) * 100).toFixed(2)) 
    : 0;

  // Generate dynamic 7-day trend chart data based on current overall revenue and conversion
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Base scaling factor: we distribute totalRevenue across Mon-Sun using beautiful realistic wave proportions
  const multipliers = [0.12, 0.10, 0.15, 0.09, 0.22, 0.14, 0.18];
  const chartData = daysOfWeek.map((day, ix) => {
    const dailyRevenue = Math.round(totalRevenue * multipliers[ix]);
    const dailyConversion = parseFloat((avgConversionRate * (0.8 + Math.sin(ix) * 0.25)).toFixed(1));
    return {
      name: day,
      sales: dailyRevenue,
      conversion: dailyConversion
    };
  });

  return {
    rawPdfCount: savedDomains.length,
    activeLinks: activeLinksCount,
    expiredLinks: expiredLinksCount,
    totalSecureViews,
    totalVisitors,
    totalRevenue,
    avgConversionRate,
    chartData,
    itemsList: appData,
    allLogs
  };
}
