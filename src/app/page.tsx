"use client";

import { useUIStore } from "@/lib/store/uiStore";
import HomeScreen from "@/components/daw/HomeScreen";
import DAWWorkspace from "@/components/daw/DAWWorkspace";

export default function Home() {
  const screenView = useUIStore((s) => s.screenView);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#06060a]">
      {screenView === "home" && <HomeScreen />}
      {screenView === "workspace" && <DAWWorkspace />}
    </div>
  );
}
