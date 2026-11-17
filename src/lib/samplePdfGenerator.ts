import { jsPDF } from "jspdf";

/**
 * Generates a beautiful 3-page PDF file in-memory using jsPDF.
 * Returns a base64 elements Data URL starting with "data:application/pdf;base64,..."
 */
export function generateSamplePdf(title: string, author: string, details: string): string {
  const doc = new jsPDF();
  
  // Page 1: Beautiful Cover Page in dark theme
  doc.setFillColor(18, 18, 18); // Dark gray base
  doc.rect(0, 0, 220, 300, "F");
  
  // Glowing decorative box edge
  doc.setDrawColor(0, 255, 189); // vault-accent: jade green
  doc.setLineWidth(0.5);
  doc.rect(10, 10, 190, 277);
  
  doc.setTextColor(0, 255, 189);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("VAULT SECURE", 105, 80, { align: "center" });
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  const splitTitle = doc.splitTextToSize(title, 160);
  doc.text(splitTitle, 105, 110, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(13);
  doc.text(`Authorized Creator Edition: ${author}`, 105, 145, { align: "center" });
  doc.text("Protected PDF Asset Delivery System", 105, 155, { align: "center" });
  
  // Accent line
  doc.setDrawColor(0, 255, 189);
  doc.setLineWidth(1);
  doc.line(60, 175, 150, 175);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Warning: Single-User IP tracking is fully enabled.", 105, 230, { align: "center" });
  doc.text("Standard copyright protection and digital forensic watermarkers applied.", 105, 240, { align: "center" });
  
  // Page 2: Contents page with premium reading theme
  doc.addPage();
  doc.setFillColor(248, 250, 252); // Soft light background
  doc.rect(0, 0, 220, 300, "F");
  
  // Header
  doc.setFillColor(18, 18, 18);
  doc.rect(0, 0, 220, 25, "F");
  doc.setTextColor(0, 255, 189);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("VAULT DIGITAL RIGHTS PROTECTION WORKFORCE", 20, 15);
  
  doc.setTextColor(18, 18, 18);
  doc.setFontSize(20);
  doc.text("Chapter 1: Digital Rights Mechanics", 20, 48);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(70, 80, 95);
  
  const bodyText = 
    `Welcome to your authorized learning book. This guide is automatically protected against common unauthorized reuse vectors by VAULT's real-time security systems.\n\n` +
    `When digital publishers upload creative resources, standard distribution portals drop a raw, unsecured object file. The core problem? Anyone who buys a template can instantly save and broadcast that raw PDF onto public chats, Reddit feeds, or cloud drives.\n\n` +
    `Our solution uses "I love PDF" page-vector decomposition algorithms. We rasterize each page component directly to high-fidelity, device-optimized screenshot canvases before the user can capture or intercept the content.\n\n` +
    `This layer makes stealing individual assets or texts incredibly difficult:`;
  const splitBody = doc.splitTextToSize(bodyText, 170);
  doc.text(splitBody, 20, 65);
  
  // Bullet points
  doc.setFont("helvetica", "bold");
  doc.text("- Raster Isolation", 25, 140);
  doc.setFont("helvetica", "normal");
  doc.text(": Fonts, absolute anchors, and links are completely embedded inside image frames.", 55, 140);
  
  doc.setFont("helvetica", "bold");
  doc.text("- Dynamic watermark", 25, 150);
  doc.setFont("helvetica", "normal");
  doc.text(": Custom customer identities are mathematically burned onto the frame.", 65, 150);

  doc.setFont("helvetica", "bold");
  doc.text("- Time Restricted", 25, 160);
  doc.setFont("helvetica", "normal");
  doc.text(": Links automatic expire within an hours-wide perimeter, avoiding storage sharing.", 60, 160);
  
  // Decorative alert box
  doc.setFillColor(235, 253, 247);
  doc.rect(20, 185, 170, 45, "F");
  doc.setDrawColor(0, 255, 189);
  doc.setLineWidth(0.5);
  doc.rect(20, 185, 170, 45);
  
  doc.setTextColor(0, 145, 100);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("CRITICAL ADVISORY FOR ALL PUBLISHERS:", 27, 200);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 50, 65);
  const advisoryTxt = `Ensure you do not upload uncompressed raw print formats unless you fully intend for final users to own the typography and links. If you need online protection, select the Convert to Image checkmark in VAULT.`;
  const splitAdvisory = doc.splitTextToSize(advisoryTxt, 156);
  doc.text(splitAdvisory, 27, 210);

  // Page 3: Resources Page
  doc.addPage();
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 220, 300, "F");
  
  // Header
  doc.setFillColor(18, 18, 18);
  doc.rect(0, 0, 220, 25, "F");
  doc.setTextColor(0, 255, 189);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("VAULT SECURE ASSET INTEGRATION", 20, 15);
  
  doc.setTextColor(18, 18, 18);
  doc.setFontSize(20);
  doc.text("Chapter 2: Active Asset References", 20, 48);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(70, 80, 95);
  doc.text(`Use the following secure resource coordinates to master your workflow:\n\n${details}`, 20, 62);
  
  // Links list with custom icons/dots
  doc.setFillColor(0, 255, 189);
  doc.circle(24, 115, 2, "F");
  doc.setTextColor(25, 30, 40);
  doc.setFont("helvetica", "bold");
  doc.text("Main Shield Portal", 32, 117);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text("https://vault.creators.io/shield-portal", 100, 117);
  
  doc.setFillColor(0, 255, 189);
  doc.circle(24, 130, 2, "F");
  doc.setTextColor(25, 30, 40);
  doc.setFont("helvetica", "bold");
  doc.text("Integrate Google Drive", 32, 132);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text("https://vault.creators.io/google-drive-sync", 100, 132);

  doc.setFillColor(0, 255, 189);
  doc.circle(24, 145, 2, "F");
  doc.setTextColor(25, 30, 40);
  doc.setFont("helvetica", "bold");
  doc.text("Secure Webhooks API", 32, 147);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text("https://api.vault.creators.io/v1/webhook", 100, 147);

  // Footer visual box
  doc.setFillColor(18, 18, 18);
  doc.rect(20, 210, 170, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("VAULT SECURE DIGITAL DELIVERY SUCCESSFUL", 105, 226, { align: "center" });
  doc.setTextColor(0, 255, 189);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("The Creator's Vault • Protecting Authors", 105, 237, { align: "center" });
  
  return doc.output("datauristring");
}
