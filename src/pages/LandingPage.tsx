import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { ArrowRight, ShieldCheck, Lock, EyeOff, Zap, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { AnimatedBackground } from "../components/ui/AnimatedBackground";

export function LandingPage() {
  const navigate = useNavigate();

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 100, damping: 15 } 
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden bg-vault-bg select-none">
      {/* Dynamic Animated Core Background */}
      <AnimatedBackground />

      <Navbar />
      
      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="relative px-4 pt-32 pb-40 flex flex-col items-center justify-center text-center overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-vault-accent/5 blur-[120px] rounded-full pointer-events-none" />
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex flex-col items-center justify-center w-full"
          >
            <motion.h2 
              variants={fadeIn}
              className="text-vault-accent font-mono text-sm sm:text-base tracking-[0.2em] uppercase mb-6 drop-shadow-[0_0_10px_rgba(0,255,189,0.3)]"
            >
              Advanced Digital Asset Defense System
            </motion.h2>
            
            <motion.h1 
              variants={fadeIn}
              className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-white tracking-tight leading-tight max-w-4xl mb-8"
            >
              Your Links Leaked <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-vault-gray">Stop Theft Today.</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeIn}
              className="text-vault-gray text-lg sm:text-xl max-w-2xl mb-12 leading-relaxed"
            >
              When you sell digital assets, buyers easily drop permanent storage URLs onto public forums or social chats. We heavily restrict automated asset redistribution.
            </motion.p>
            
            <motion.div 
              variants={fadeIn}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-8"
            >
              <Button size="lg" className="w-full sm:w-auto text-base group" onClick={() => navigate('/creator-login')}>
                Creator Login
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base" onClick={() => navigate('/customer-signup')}>
                User Sign Up
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Features/The Shield Preview */}
        <section id="shield" className="py-24 bg-vault-card/20 border-y border-vault-border backdrop-blur-sm">
          <div className="container mx-auto px-4">
             <motion.div 
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true, margin: "-100px" }}
               variants={containerVariants}
               className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
             >
                <motion.div 
                  variants={cardVariants}
                  whileHover={{ y: -8, borderColor: "rgba(0, 255, 189, 0.4)", boxShadow: "0 10px 30px -10px rgba(0,255,189,0.12)" }}
                  className="p-6 bg-vault-card border border-vault-border rounded-xl transition-all duration-300"
                >
                  <Lock className="w-10 h-10 text-vault-accent mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Timed Self-Destruction</h3>
                  <p className="text-vault-gray text-sm">Links permanently expire 2 hours after generation. No chance for delayed forum sharing.</p>
                </motion.div>
                
                <motion.div 
                  variants={cardVariants}
                  whileHover={{ y: -8, borderColor: "rgba(0, 255, 189, 0.4)", boxShadow: "0 10px 30px -10px rgba(0,255,189,0.12)" }}
                  className="p-6 bg-vault-card border border-vault-border rounded-xl transition-all duration-300"
                >
                  <EyeOff className="w-10 h-10 text-vault-accent mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">IP Tracking Shield</h3>
                  <p className="text-vault-gray text-sm">We log and limit access by IP address, shutting down mass distribution instantly.</p>
                </motion.div>
                
                <motion.div 
                  variants={cardVariants}
                  whileHover={{ y: -8, borderColor: "rgba(0, 255, 189, 0.4)", boxShadow: "0 10px 30px -10px rgba(0,255,189,0.12)" }}
                  className="p-6 bg-vault-card border border-vault-border rounded-xl transition-all duration-300"
                >
                  <Zap className="w-10 h-10 text-vault-accent mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Zero Friction Setup</h3>
                  <p className="text-vault-gray text-sm">No complex DRM software. Upload your asset, get a link, protect your revenue.</p>
                </motion.div>
             </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32 px-4 max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Plan options mapped for Indian creators</h2>
            <p className="text-vault-gray">Simple, transparent pricing to protect your hard work.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Starter Card */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              whileHover={{ y: -6, borderColor: "rgba(0, 255, 189, 0.25)", boxShadow: "0 12px 25px -10px rgba(0,255,189,0.06)" }}
              className="p-8 rounded-2xl bg-vault-card border border-vault-border transition-all duration-300"
            >
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">Starter Account</h3>
                <p className="text-vault-accent text-sm font-medium mb-4">Pay As You Earn</p>
                <p className="text-vault-gray text-sm mb-6">Perfect if you are hosting your first file asset.</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold text-white">2.5%</span>
                  <span className="text-vault-gray">per transaction</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                {["Unlimited secure links", "2-hour timed expiration", "Basic IP tracking"].map((feature, i) => (
                  <motion.li 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-3 text-vault-gray"
                  >
                    <ShieldCheck className="w-5 h-5 text-vault-gray/50 animate-pulse" />
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate('/customer-signup')}>GET STARTED FREE</Button>
            </motion.div>

            {/* Pro Card */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              whileHover={{ y: -6, borderColor: "rgba(0, 255, 189, 0.8)", boxShadow: "0 20px 40px -15px rgba(0,255,189,0.25)" }}
              className="p-8 rounded-2xl bg-vault-card border border-vault-accent relative transition-all duration-300"
            >
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-vault-accent text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-bounce" style={{ animationDuration: "3s" }}>
                Pro Choice
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">The Pro Vault</h3>
                <p className="text-vault-accent text-sm font-medium mb-4">Built for full-time professional creators</p>
                <div className="flex items-baseline gap-1 mt-[46px]">
                  <span className="text-4xl font-display font-bold text-white">₹499</span>
                  <span className="text-vault-gray">/month (0% platform fees)</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                {["Zero transaction fees", "Custom domain branding", "Advanced sales analytics & reports"].map((feature, i) => (
                  <motion.li 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-3 text-white"
                  >
                    <ShieldCheck className="w-5 h-5 text-vault-accent" />
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => navigate('/customer-signup')}>UPGRADE TO PRO</Button>
            </motion.div>
          </div>
        </section>
      </main>
      
      <footer className="border-t border-vault-border py-8 text-center text-vault-gray text-sm relative z-10 bg-vault-bg">
        <div className="container mx-auto flex items-center justify-center gap-2">
          <Shield className="w-4 h-4" />
          <span>© 2026 VAULT - Digital Asset Defense.</span>
        </div>
      </footer>
    </div>
  );
}

