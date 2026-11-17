import React from "react";
import { Sidebar } from "./Sidebar";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedBackground } from "../ui/AnimatedBackground";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-vault-bg text-white flex relative overflow-hidden select-none">
      {/* Background layer for the entire dashboard space */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AnimatedBackground />
      </div>

      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto relative z-10">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

