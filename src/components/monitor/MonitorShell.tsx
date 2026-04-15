"use client";

import { useUIStore } from "@/lib/store/uiStore";
import PowerButton from "./PowerButton";
import ScanlineOverlay from "./ScanlineOverlay";
import BootSequence from "../boot/BootSequence";
import DAWWorkspace from "../daw/DAWWorkspace";
import HomeScreen from "../daw/HomeScreen";

/** Layered CSS backgrounds: fine vertical striations + warm wash over beige/brown base */
const woodBezelBg = [
  "repeating-linear-gradient(90deg, transparent 0 2px, rgba(55,40,28,0.07) 2px 3px)",
  "repeating-linear-gradient(90deg, rgba(90,65,45,0.06) 0 1px, transparent 1px 11px, rgba(45,32,22,0.09) 11px 12px, transparent 12px 24px)",
  "linear-gradient(95deg, rgba(245,230,210,0.35) 0%, transparent 42%, rgba(70,48,32,0.18) 100%)",
  "linear-gradient(180deg, #e6d4bc 0%, #cfa882 26%, #b0895e 55%, #8f6b45 82%, #6b4e36 100%)",
].join(", ");

const woodNeckBg = [
  "repeating-linear-gradient(90deg, transparent 0 1px, rgba(40,28,20,0.08) 1px 2px)",
  "linear-gradient(180deg, #b0895e 0%, #8f6b45 55%, #6b4e36 100%)",
].join(", ");

export default function MonitorShell() {
  const powerState = useUIStore((s) => s.powerState);
  const screenView = useUIStore((s) => s.screenView);
  const isOn = powerState === "on";

  return (
    <div
      className="relative flex items-center justify-end flex-col h-screen w-screen select-none overflow-hidden"
      style={{ backgroundColor: "#060608" }}
    >
      {/* ── Ambient city warmth — always present, like light bleeding through a window ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            "radial-gradient(ellipse 90% 55% at 50% 44%, rgba(200,155,70,0.055) 0%, transparent 70%)",
            "radial-gradient(ellipse 70% 25% at 50% 100%, rgba(180,120,40,0.07) 0%, transparent 65%)",
          ].join(", "),
        }}
      />

      {/* ── Desk surface ── */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: 28,
          borderTop: "1px solid rgba(40,40,40,0.6)",
          background: "linear-gradient(180deg, #111 0%, #0a0a0a 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 4,
            left: "20%",
            right: "20%",
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
          }}
        />
      </div>

      {/* ── Left silhouette: studio monitor speaker (KRK-style) ── */}
      <div
        className="absolute bottom-0 pointer-events-none"
        style={{ left: "2%", filter: "blur(5px)", opacity: 0.18 }}
      >
        <div style={{ width: 72, height: 130, background: "#111", borderRadius: "4px 4px 0 0", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", width: 14, height: 14, borderRadius: "50%", background: "#0d0d0d", border: "1px solid #1e1e1e" }} />
          <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", width: 52, height: 52, borderRadius: "50%", background: "#0c0c0c", border: "2px solid rgba(180,140,0,0.3)", boxShadow: "0 0 10px rgba(180,140,0,0.12)" }} />
        </div>
      </div>

      {/* ── Right silhouette: MIDI keyboard controller ── */}
      <div
        className="absolute bottom-0 pointer-events-none"
        style={{ right: "1%", filter: "blur(5px)", opacity: 0.18 }}
      >
        <div style={{ width: 200, height: 18, background: "#0e0e0e", borderRadius: "3px 3px 0 0", display: "flex", alignItems: "center", justifyContent: "space-evenly", padding: "0 20px", marginBottom: 2 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #262626" }} />
          ))}
        </div>
        <div style={{ width: 200, height: 52, background: "#0e0e0e", borderRadius: "0 0 3px 3px", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, #151515 0px, #151515 10px, #0a0a0a 10px, #0a0a0a 11px)" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "52%", backgroundImage: "repeating-linear-gradient(90deg, transparent 0px, transparent 6px, #080808 6px, #080808 10px, transparent 10px, transparent 17px)" }} />
        </div>
      </div>

      {/* ── Monitor unit (display + stand) ── */}
      <div className="relative z-[1] w-[88%] max-w-[1200px] flex flex-col items-center mb-0"
        style={{ height: "min(92vh, 980px)", perspective: "2200px", perspectiveOrigin: "50% 30%" }}
      >
        {/* ── Bezel + depth wrapper ── */}
        <div
          className="relative flex-1 w-full"
          style={{ transform: "rotateX(1.5deg)", transformOrigin: "50% 100%" }}
        >
          {/* ── Casing backing plate — the physical body of the monitor visible at sides/bottom ── */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: 6,
              left: -7,
              right: -7,
              bottom: -12,
              borderRadius: 20,
              background: "linear-gradient(170deg, #3a2214 0%, #1e0f06 55%, #100804 100%)",
              border: "1px solid #0d0603",
              boxShadow: "0 28px 70px rgba(0,0,0,0.85), 0 10px 28px rgba(0,0,0,0.6)",
            }}
          />

          {/* ── Left side face — angled strip catching ambient light ── */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: 10,
              bottom: 4,
              left: -6,
              width: 7,
              background: "linear-gradient(90deg, #0d0603 0%, #2e1b0e 70%, #3a2214 100%)",
              borderRadius: "3px 0 0 3px",
            }}
          />

          {/* ── Right side face ── */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: 10,
              bottom: 4,
              right: -6,
              width: 7,
              background: "linear-gradient(90deg, #3a2214 0%, #2e1b0e 30%, #0d0603 100%)",
              borderRadius: "0 3px 3px 0",
            }}
          />

          {/* ── Bottom face — the horizontal underside edge ── */}
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: -11,
              left: 6,
              right: 6,
              height: 13,
              background: "linear-gradient(180deg, #1e0f06 0%, #100804 100%)",
              borderRadius: "0 0 10px 10px",
            }}
          />

        {/* ── Bezel ── */}
        <div
          className={`relative w-full h-full flex flex-col rounded-2xl overflow-hidden transition-shadow duration-700`}
          style={{
            background: woodBezelBg,
            border: "1px solid #5c4030",
            boxShadow: isOn
              ? "0 0 0 1px #3d2818, 0 2px 3px rgba(255,255,255,0.2) inset, 0 0 80px 20px rgba(180,220,255,0.10), 0 0 160px 60px rgba(180,220,255,0.06), 0 0 320px 120px rgba(180,220,255,0.03)"
              : "0 0 0 1px #3d2818, 0 2px 3px rgba(255,255,255,0.2) inset",
          }}
        >
          {/* ── Screen Inset ── */}
          <div
            className="relative flex-1 m-2 md:m-3 rounded-lg overflow-hidden"
            style={{
              boxShadow: [
                /* outer rim — the hard dark channel lip */
                "0 0 0 2px #100804",
                /* channel depth shadow below the lip */
                "0 3px 14px rgba(0,0,0,0.75)",
                /* inset top — deepest shadow, light comes from above */
                "inset 0 5px 14px rgba(0,0,0,0.92)",
                /* inset left */
                "inset 4px 0 10px rgba(0,0,0,0.65)",
                /* inset bottom — lighter, some desk-bounce light */
                "inset 0 -2px 7px rgba(0,0,0,0.38)",
                /* inset right */
                "inset -2px 0 7px rgba(0,0,0,0.38)",
                /* screen-glass micro-highlight — faint rim right at the screen */
                "inset 0 0 0 1px rgba(255,255,255,0.055)",
              ].join(", "),
            }}
          >
            <div className="relative w-full h-full bg-[#020202]">
              {powerState === "off" && (
                <div className="absolute inset-0 bg-[#050505]" />
              )}
              {powerState === "booting" && <BootSequence />}
              {isOn && screenView === "home" && <HomeScreen />}
              {isOn && screenView === "workspace" && <DAWWorkspace />}
              <ScanlineOverlay />
            </div>
          </div>

          {/* ── Chin ── */}
          <div className="flex items-center justify-between px-4 md:px-6 pb-1.5 pt-0.5">
            <span className="text-[8px] md:text-[9px] font-mono tracking-[0.25em] uppercase" style={{ color: "#3d2818" }}>
              Studio Monitor
            </span>
            <PowerButton />
          </div>
        </div>
        </div>{/* ── /Bezel + depth wrapper ── */}

        {/* ── Stand Neck ── */}
        <div
          className="relative z-10 mx-auto shrink-0"
          style={{
            width: 80,
            height: 50,
            background: woodNeckBg,
            clipPath: "polygon(10% 0%, 90% 0%, 95% 100%, 5% 100%)",
            boxShadow: "inset 1px 0 0 rgba(255,255,255,0.1), inset -1px 0 0 rgba(0,0,0,0.25)",
          }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 h-full pointer-events-none"
            style={{
              width: 20,
              background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)",
            }}
          />
        </div>


        {/* ── Desk surface glow (screen light on desk) ── */}
        <div
          className={`absolute pointer-events-none transition-opacity duration-1000 ${
            isOn ? "opacity-100" : "opacity-0"
          }`}
          style={{
            bottom: -40,
            left: "10%",
            right: "10%",
            height: 80,
            background: "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(180,220,255,0.14) 0%, rgba(140,200,255,0.06) 40%, transparent 80%)",
          }}
        />

        {/* ── Base reflection line ── */}
        <div
          className={`absolute pointer-events-none transition-opacity duration-1000 ${
            isOn ? "opacity-100" : "opacity-0"
          }`}
          style={{
            bottom: -4,
            left: "50%",
            transform: "translateX(-50%)",
            width: 200,
            height: 3,
            background: "radial-gradient(ellipse 100% 100% at 50% 50%, rgba(200,230,255,0.15) 0%, transparent 70%)",
            filter: "blur(2px)",
          }}
        />

        {/* ── Drop shadow from base onto desk ── */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            bottom: -8,
            width: 320,
            height: 16,
            background: "rgba(0,0,0,0.4)",
            filter: "blur(12px)",
          }}
        />
      </div>
    </div>
  );
}
