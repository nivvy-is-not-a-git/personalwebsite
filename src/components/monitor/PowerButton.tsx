"use client";

import { useUIStore } from "@/lib/store/uiStore";
import { motion } from "framer-motion";

export default function PowerButton() {
  const powerState = useUIStore((s) => s.powerState);
  const togglePower = useUIStore((s) => s.togglePower);

  const isOff = powerState === "off";
  const ledColor = isOff ? "var(--color-led-red)" : "var(--color-led-green)";
  const ledGlow = isOff
    ? "0 0 4px rgba(255,23,68,0.5)"
    : "0 0 6px rgba(0,230,118,0.6), 0 0 12px rgba(0,230,118,0.2)";

  return (
    <motion.button
      onClick={togglePower}
      whileTap={{ scale: 0.92 }}
      className="relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full cursor-pointer focus:outline-none"
      style={{
        background:
          "radial-gradient(circle at 40% 35%, #2a2a2a, #1a1a1a 60%, #111 100%)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.04)",
      }}
      aria-label={isOff ? "Power on" : "Power off"}
    >
      {/* Power icon ring */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-muted"
      >
        <path d="M12 2v6" />
        <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
      </svg>

      {/* LED indicator */}
      <motion.div
        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
        animate={{ backgroundColor: ledColor, boxShadow: ledGlow }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}
