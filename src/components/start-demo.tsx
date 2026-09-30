"use client";
import { motion } from "motion/react";
import { Icon } from "./icons";
import { startDemo } from "./demo-guide";

export function StartDemoButton() {
  return (
    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={startDemo} className="chip h-6 bg-pine text-on-pine">
      <Icon name="play" weight="fill" className="size-3 text-lemon" /> Start guided demo
    </motion.button>
  );
}
