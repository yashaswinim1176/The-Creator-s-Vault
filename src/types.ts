export interface LinkRecord {
  id: string;
  assetName: string;
  buyerEmail: string;
  expiresAt: string; // ISO date string
  status: "Active" | "Expired";
  ipTracking: string;
  originalId?: any;
  domainName?: string;
  timeRestricted?: string;
  allowedEmails?: string[];
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconUrl?: string;
}
