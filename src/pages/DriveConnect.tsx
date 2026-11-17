import { useState, useEffect } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button } from "../components/ui/Button";
import { FileIcon, ExternalLink, FileText, X, Shield } from "lucide-react";
import { initAuth, googleSignIn, logout } from "../lib/auth";

export function DriveConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth((user) => {
      setIsConnected(true);
      setUserEmail(user.email);
    }, () => {
      setIsConnected(false);
      setUserEmail(null);
    });
    return () => unsubscribe();
  }, []);

  const handleConnectGmail = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const { user } = await googleSignIn(true);
      setIsConnected(true);
      setUserEmail(user.email);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        console.error("Failed to connect Gmail", err);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await logout();
    setIsConnected(false);
  };


  return (
    <DashboardLayout>
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-vault-card border border-vault-border rounded-xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-vault-border bg-[#1a1a1a]">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-vault-accent" />
                <div>
                  <h3 className="text-white font-medium">{previewFile}</h3>
                  <p className="text-xs text-vault-gray flex items-center gap-1">
                    <Shield className="w-3 h-3 text-vault-accent" /> Previewing from Google Drive
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 bg-white/5 flex items-center justify-center p-8 relative overflow-hidden">
                {/* Simulated PDF Document Content */}
                <div className="w-full h-full max-w-4xl bg-white rounded-lg shadow-xl p-12 overflow-y-auto text-black">
                  <h1 className="text-3xl font-bold mb-6 border-b pb-4">Crypto Trading Guide 2026</h1>
                  <p className="mb-4">Welcome to the complete guide on crypto trading. This secure document is protected by VAULT.</p>
                  <p className="mb-4 text-gray-600">The content within this document is for the authorized buyer only. IP tracking is active.</p>
                  
                  <h2 className="text-2xl font-bold mt-8 mb-4">Chapter 1: Market Fundamentals</h2>
                  <p className="mb-4 text-gray-700">Understanding order books, liquidity and volume profiles.</p>
                  <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-6 border border-gray-200">
                    <span className="text-gray-400">[Chart Placeholder]</span>
                  </div>
                  
                   <h2 className="text-2xl font-bold mt-8 mb-4">Chapter 2: Risk Management</h2>
                  <p className="text-gray-700">Never risk more than 1% of your portfolio on a single trade.</p>
                </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Google Drive Integration</h1>
        <p className="text-vault-gray">Connect your Gmail to select files directly from Google Drive without uploading.</p>
      </div>

      {!isConnected ? (
        <div className="bg-vault-card border border-vault-border rounded-xl p-12 text-center max-w-2xl mx-auto mt-12">
          <div className="w-20 h-20 mx-auto mb-6 bg-vault-accent/10 rounded-2xl flex items-center justify-center border border-vault-accent/20">
            <Shield className="w-10 h-10 text-vault-accent" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Connect Google Drive</h2>
          <p className="text-vault-gray mb-8">
            Skip the manual upload. Link your Google account to instantly create secure VAULT links for any document, PDF, or archive stored in your Drive.
          </p>
          <Button size="lg" onClick={handleConnectGmail} disabled={isConnecting} className="bg-white text-black hover:bg-gray-200 shadow-none border-none disabled:bg-gray-300 disabled:cursor-not-allowed">
            <div className="w-5 h-5 mr-3 flex shrink-0 items-center justify-center bg-[#4285F4] rounded text-white text-xs font-bold font-sans">G</div>
            {isConnecting ? "Connecting..." : "Sign in with Google"}
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between p-6 bg-vault-card border border-vault-accent/30 rounded-xl">
             <div className="flex items-center gap-4">
                <div>
                   <p className="font-bold text-white">Connected to Google Drive</p>
                   <p className="text-vault-gray text-sm">{userEmail || "Connected"}</p>
                </div>
             </div>
             <Button variant="outline" size="sm" onClick={handleDisconnect}>Disconnect</Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
