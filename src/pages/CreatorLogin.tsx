import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowRight, FileIcon, Loader2, UploadCloud } from "lucide-react";
import { Button } from "../components/ui/Button";
import { initAuth, googleSignIn, getAccessToken, logout } from "../lib/auth";
import { motion } from "motion/react";
import { AnimatedBackground } from "../components/ui/AnimatedBackground";
import { safeJsonParse, safeStorage, idbStorage } from "../lib/utils";

export function CreatorLogin() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState("");
  const [timeRestricted, setTimeRestricted] = useState("2 Hours");
  const [allowedEmailsInput, setAllowedEmailsInput] = useState("");
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [creatorEmail, setCreatorEmail] = useState<string | null>(null);

  useEffect(() => {
    logout();
    const unsubscribe = initAuth((user) => {
      setIsGoogleConnected(true);
      setCreatorEmail(user.email);
      fetchDriveFiles();
    }, () => {
      setIsGoogleConnected(false);
      setCreatorEmail(null);
    });
    return () => unsubscribe();
  }, []);

  const handleConnectGmail = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const { user } = await googleSignIn(true);
      setIsGoogleConnected(true);
      setCreatorEmail(user.email);
      fetchDriveFiles();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        console.error("Failed to connect Gmail", err);
        if (err?.code === 'auth/unauthorized-domain') {
          alert("Configuration Error: This domain is not authorized for OAuth operations in your Firebase project. Please add this preview URL to your Firebase Console > Authentication > Settings > Authorized Domains.");
        } else {
          alert("Authentication failed. Please try again.");
        }
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchDriveFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      
      const res = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType='application/pdf'", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.slice(-4).toLowerCase() === ".pdf")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile({ id: "local", name: file.name, file, dataUrl: event.target?.result });
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a PDF file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.slice(-4).toLowerCase() === ".pdf")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile({ id: "local", name: file.name, file, dataUrl: event.target?.result });
      };
      reader.readAsDataURL(file);
    } else {
       alert("Please upload a PDF file.");
    }
  };

  return (
    <div className="min-h-screen bg-vault-bg flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background and grid */}
      <AnimatedBackground />

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-vault-accent/30 to-vault-border content-[''] pointer-events-none" />
        <div className="relative bg-vault-card rounded-3xl p-8 backdrop-blur-xl border border-vault-border/50 shadow-2xl">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex justify-center mb-6">
              <Shield className="h-10 w-10 text-vault-accent drop-shadow-[0_0_15px_rgba(0,255,189,0.5)] cursor-pointer" />
            </Link>
            <h1 className="text-2xl font-display font-bold text-white mb-2">Creator Login</h1>
            <p className="text-vault-gray text-sm">Secure your digital assets and domain</p>
          </div>

          <div className="space-y-6">
            {!isGoogleConnected ? (
              <Button 
                size="lg" 
                onClick={handleConnectGmail} 
                disabled={isConnecting}
                className="w-full bg-white hover:bg-gray-200 text-black border-none flex items-center justify-center shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <div className="w-5 h-5 mr-3 flex items-center justify-center bg-blue-500 rounded-full text-white text-xs font-bold font-sans">G</div>
                {isConnecting ? "Connecting..." : "Connect with Gmail"}
              </Button>
            ) : (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center mb-6">
                  <p className="text-sm font-medium text-green-400">✓ Gmail Connected: {creatorEmail || "Successfully"}</p>
                </div>
                
                <div className="mb-4 space-y-4">
                  <label className="block text-sm font-medium text-vault-gray">Upload or Select PDF</label>

                  {/* Drag and Drop Local Upload */}
                  <div 
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDragging ? "border-vault-accent bg-vault-accent/5" : "border-vault-border hover:border-vault-gray bg-[#1a1a1a]"}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <UploadCloud className="w-8 h-8 text-vault-gray mb-3" />
                    <p className="text-sm text-vault-gray mb-1">Drag & Drop PDF here or <span className="text-vault-accent">browse</span></p>
                    <input id="file-upload" type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                  </div>

                  {/* Google Drive Files List */}
                  <div className="bg-[#1a1a1a] border border-vault-border rounded-xl max-h-48 overflow-y-auto">
                    <div className="p-3 border-b border-vault-border bg-vault-card sticky top-0">
                      <p className="text-xs font-medium text-white flex justify-between items-center">
                        Your Google Drive PDFs
                        {isLoadingFiles && <Loader2 className="w-3 h-3 animate-spin text-vault-accent" />}
                      </p>
                    </div>
                    {isLoadingFiles ? (
                      <div className="p-4 text-center text-sm text-vault-gray">Loading files...</div>
                    ) : files.length > 0 ? (
                      <div className="divide-y divide-vault-border">
                        {files.map(file => (
                          <div 
                            key={file.id} 
                            onClick={async () => {
                              setSelectedFile({ ...file, isRetrieving: true });
                              try {
                                const token = await getAccessToken();
                                const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                const blob = await res.blob();
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setSelectedFile({ ...file, dataUrl: event.target?.result, isRetrieving: false });
                                };
                                reader.readAsDataURL(blob);
                              } catch (err) {
                                console.error(err);
                                setSelectedFile(file);
                              }
                            }}
                            className={`p-3 text-sm cursor-pointer flex items-center transition-colors ${selectedFile?.id === file.id ? "bg-vault-accent/10 text-vault-accent" : "text-vault-gray hover:bg-vault-card hover:text-white"}`}
                          >
                            <FileIcon className="w-4 h-4 mr-3 shrink-0" />
                            <span className="truncate">{file.name}</span>
                            {selectedFile?.id === file.id && selectedFile?.isRetrieving && (
                              <Loader2 className="w-3 h-3 ml-2 animate-spin text-vault-accent" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-vault-gray">No PDFs found in Drive</div>
                    )}
                  </div>
                </div>

                {selectedFile && (
                   <div className="mb-6 p-4 bg-vault-accent/5 border border-vault-accent/20 rounded-lg flex items-center gap-3">
                      <FileIcon className="w-5 h-5 text-vault-accent" />
                      <div>
                        <p className="text-sm text-white font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-xs text-vault-gray">Ready to secure</p>
                      </div>
                   </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-vault-gray mb-2">Custom Domain Name for PDF</label>
                  <input 
                    type="text" 
                    placeholder="e.g. course.mycreator.com" 
                    className="w-full bg-[#1a1a1a] border border-vault-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-vault-accent focus:ring-1 focus:ring-vault-accent transition-all animate-none text-sm"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                  <p className="text-xs text-vault-gray mt-2">Enter the domain where customers will access this file.</p>
                </div>

                <div className="mb-8 border-t border-vault-border/55 pt-6">
                  <label className="block text-sm font-medium text-vault-gray mb-3">Link Lifespan / Time Restriction</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["1 Hour", "2 Hours", "12 Hours", "24 Hours", "7 Days", "No Limit"].map((option) => (
                      <button
                        type="button"
                        key={option}
                        onClick={() => setTimeRestricted(option)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold tracking-tight transition-all border cursor-pointer text-center ${
                          timeRestricted === option 
                            ? "bg-vault-accent text-black border-vault-accent hover:bg-vault-accent/90" 
                            : "bg-[#141414] text-vault-gray border-vault-border hover:text-white hover:border-vault-gray/40"
                        }`}
                      >
                        ⏱ {option}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-vault-gray mt-2.5">After this elapsed duration, the document access is instantly blurred/locked to protect secondary cameras.</p>
                </div>

                <div className="mb-8 border-t border-vault-border/55 pt-6">
                  <label className="block text-sm font-medium text-vault-gray mb-3">Grant Gmail Access</label>
                  <input 
                    type="text" 
                    placeholder="e.g. user1@gmail.com, user2@gmail.com (Optional)" 
                    className="w-full bg-[#1a1a1a] border border-vault-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-vault-accent focus:ring-1 focus:ring-vault-accent transition-all animate-none text-sm"
                    value={allowedEmailsInput}
                    onChange={(e) => setAllowedEmailsInput(e.target.value)}
                  />
                  <p className="text-xs text-vault-gray mt-2">Only these Gmail accounts will be allowed to access the PDF. Separate multiple emails with commas. Leave empty to allow anyone with the link.</p>
                </div>

                <Button 
                  size="lg" 
                  className="w-full group hover:text-black cursor-pointer"
                  disabled={!selectedFile || !domain}
                  onClick={async () => {
                    const allowedEmails = allowedEmailsInput.split(',').map(e => e.trim().toLowerCase()).filter(e => e !== "");
                    
                    const newDomain = {
                      id: Date.now(),
                      name: domain.includes(".") ? domain : `${domain}.vault.link`,
                      creator: creatorEmail || "Current Creator",
                      creatorEmail: creatorEmail,
                      timeRestricted: timeRestricted,
                      isPro: false,
                      originalFileName: selectedFile?.name || "Uploaded PDF",
                      fileData: selectedFile?.dataUrl || null,
                      createdAt: new Date().toISOString(),
                      allowedEmails: allowedEmails.length > 0 ? allowedEmails : undefined
                    };
                    const existing = await idbStorage.getVaultDomains();
                    await idbStorage.saveVaultDomains([newDomain, ...existing]);
                    navigate('/dashboard');
                  }}
                >
                  Continue to Workspace <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
