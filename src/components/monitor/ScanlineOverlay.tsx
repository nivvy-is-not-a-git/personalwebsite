"use client";

export default function ScanlineOverlay() {
  return (
    <>
      {/* CRT scanlines — tighter pitch, more visible */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.08) 1px, rgba(0,0,0,0.08) 2px)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Horizontal RGB sub-pixel hint */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(255,0,0,0.015), rgba(0,255,0,0.015) 1px, rgba(0,100,255,0.015) 2px, transparent 3px)",
        }}
      />

      {/* Deep vignette — strong radial fade from edges */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background:
            "radial-gradient(ellipse 85% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.35) 80%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Inner edge shadow — simulates recessed glass panel */}
      <div
        className="absolute inset-0 pointer-events-none z-40 rounded-lg"
        style={{
          boxShadow:
            "inset 0 0 60px rgba(0,0,0,0.6), inset 0 0 120px rgba(0,0,0,0.3), inset 0 2px 4px rgba(0,0,0,0.5)",
        }}
      />

      {/* Subtle screen reflection / gloss highlight */}
      <div
        className="absolute pointer-events-none z-40"
        style={{
          top: "3%",
          left: "5%",
          width: "60%",
          height: "12%",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
          borderRadius: "50%",
          filter: "blur(8px)",
        }}
      />
    </>
  );
}
