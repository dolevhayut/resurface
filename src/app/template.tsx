"use client";
import { motion } from "motion/react";

// Route transition: content eases in with a short blur-lift on every navigation.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6, filter: "blur(3px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ type: "spring", stiffness: 260, damping: 30 }}>
      {children}
    </motion.div>
  );
}
