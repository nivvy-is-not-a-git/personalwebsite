# Building a DAW-Themed Portfolio — Claude Code Session

**Project:** `avin_shetty.portfolio` — a Next.js portfolio styled as a Digital Audio Workstation  
**Stack:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, GSAP, Zustand

---

## The Idea

> **User:** I want my portfolio to look like FL Studio. Career timeline = playlist, skills = VST plugins, experience blocks = audio clips. Can you help me architect this?

**Assistant:** That's a genuinely cool concept. Let me think through the architecture before we write any code.

The core mental model:
- **Monitor shell** — the outer CRT monitor bezel (boot sequence, scanlines, power button)
- **Home screen** — fake OS desktop, double-click `.portfolio` file to "open" it
- **DAW Workspace** — the actual portfolio content, split into panels mirroring FL Studio:
  - Top toolbar (transport controls: play/pause/stop, BPM)
  - Left sidebar (plugin browser = skills as `.vst` files)
  - Center (playlist timeline = career history as clip blocks)
  - Bottom (mixer = currently selected item detail panel)

State is thin — a single Zustand store manages transport state, playhead position, selected clip, and muted tracks. Let me scaffold that first.

---

## Step 1 — Zustand Store

```
> write src/lib/store/uiStore.ts
```

```typescript
import { create } from "zustand";

type TransportState = "stopped" | "playing" | "paused";

interface UIStore {
  // Screen routing
  screen: "boot" | "home" | "workspace";
  openWorkspaceFromHome: () => void;

  // Transport
  transportState: TransportState;
  playheadProgress: number; // 0–1 over the playable region
  bpm: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setPlayheadProgress: (p: number) => void;

  // Timeline selection
  selectedItemId: string | null;
  activeItemIds: string[];
  selectItem: (id: string | null) => void;
  setActiveItemIds: (ids: string[]) => void;

  // Mixer
  mutedTracks: Set<string>;
  toggleMute: (track: string) => void;
  soloTrack: string | null;
  setSolo: (track: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  screen: "boot",
  openWorkspaceFromHome: () => set({ screen: "workspace" }),

  transportState: "stopped",
  playheadProgress: 0,
  bpm: 130,
  play: () => set({ transportState: "playing" }),
  pause: () => set({ transportState: "paused" }),
  stop: () => set({ transportState: "stopped", playheadProgress: 0 }),
  setPlayheadProgress: (p) => set({ playheadProgress: p }),

  selectedItemId: null,
  activeItemIds: [],
  selectItem: (id) => set({ selectedItemId: id }),
  setActiveItemIds: (ids) => set({ activeItemIds: ids }),

  mutedTracks: new Set(),
  toggleMute: (track) =>
    set((s) => {
      const next = new Set(s.mutedTracks);
      next.has(track) ? next.delete(track) : next.add(track);
      return { mutedTracks: next };
    }),
  soloTrack: null,
  setSolo: (track) => set({ soloTrack: track }),
}));
```

---

## Step 2 — Career Data Schema

> **User:** How should I model my experience and projects?

**Assistant:** Each item on the timeline is a "clip" — it has a track (row), a column start, a span (width), a color, and metadata shown in the mixer panel when selected.

```
> write src/lib/data/careerData.ts
```

```typescript
export interface TimelineItem {
  id: string;
  track: "experience" | "projects" | "design-team";
  title: string;
  subtitle: string;
  period: string;
  span: number;   // months wide
  col: number;    // month column start (Jan 2025 = col 1)
  color: string;
  glowClass: string;
  selectedGlowClass: string;
  techStack: string[];
  achievements: string[];
  links?: { label: string; url: string }[];
  summary?: string;
  primaryUrl?: string;
}

export interface Skill {
  name: string;
  extension: ".vst" | ".dll" | ".so" | ".au";
  eq: number; // 0–100, drives the EQ bar height in the mixer
}
```

Skills get `.vst` / `.dll` extensions based on type — languages are `.vst`, data tools are `.dll`. Small detail that makes the fiction feel tight.

---

## Step 3 — Playlist Timeline

This is the most complex component. The timeline is a CSS grid where columns = months and rows = tracks.

> **User:** The playhead needs to animate smoothly with real BPM timing, not just a CSS transition.

**Assistant:** Right — we need a `requestAnimationFrame` loop driven by the store's BPM. Here's the core loop logic inside `PlaylistTimeline`:

```typescript
// Constants
const TOTAL_COLS = 16;       // Jan 2025 → Apr 2026
const BEATS_PER_COL = 4;
const TOTAL_BEATS = TOTAL_COLS * BEATS_PER_COL;

useEffect(() => {
  if (transportState !== "playing") return;

  let startTime: number | null = null;
  let startProgress = playheadProgress;
  let rafId: number;

  const secondsPerBeat = 60 / bpm;
  const totalDuration = TOTAL_BEATS * secondsPerBeat;

  const tick = (now: number) => {
    if (startTime === null) startTime = now;
    const elapsed = (now - startTime) / 1000;
    const delta = elapsed / totalDuration;
    const next = Math.min(startProgress + delta, PLAYBACK_END);

    setPlayheadProgress(next);

    // Determine which clips the playhead is currently inside
    const activeCols = next * TOTAL_COLS;
    const hitting = timelineItems
      .filter((item) => {
        if (mutedTracks.has(item.track)) return false;
        return activeCols >= item.col - 1 && activeCols < item.col - 1 + item.span;
      })
      .map((i) => i.id);
    setActiveItemIds(hitting);

    if (next < PLAYBACK_END) {
      rafId = requestAnimationFrame(tick);
    } else {
      stop();
    }
  };

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}, [transportState, bpm]);
```

The playhead div is absolutely positioned using `left: ${playheadProgress * 100}%` inside the grid container — no CSS animation, pure JS-driven position.

---

## Step 4 — Plugin Browser (Skills Sidebar)

> **User:** I want the skill browser to feel like browsing VST plugins — expandable categories, each skill shows an EQ bar.

**Assistant:** The EQ bar height maps directly to the `eq` field (0–100). We clamp it so nothing looks flat or clips.

```typescript
// PluginsSidebar.tsx
function EQBar({ value }: { value: number }) {
  const h = Math.max(4, Math.round((value / 100) * 32));
  return (
    <div className="flex items-end gap-px" style={{ height: 16 }}>
      {[0.4, 0.7, 1, 0.85, 0.55].map((scale, i) => (
        <div
          key={i}
          className="w-0.5 rounded-sm bg-cyan/70"
          style={{ height: Math.round(h * scale) }}
        />
      ))}
    </div>
  );
}
```

Each skill row in the sidebar:
```
Python.vst         ████ 92
TypeScript.vst     ███  85
Snowflake.dll      ████ 85
```

Clicking a skill highlights any timeline clips that use it.

---

## Step 5 — Boot Sequence & Monitor Shell

> **User:** I want the whole thing to feel like booting up an old monitor. Scanlines, flicker, the works.

**Assistant:** Three layers:

1. **`BootSequence`** — typewriter-style terminal output, then fades out
2. **`ScanlineOverlay`** — fixed `::after` pseudo-element with repeating-linear-gradient lines + subtle CRT vignette
3. **`MonitorShell`** — outer bezel div with rounded corners, slight perspective transform

```typescript
// ScanlineOverlay.tsx — pure CSS, no JS
export function ScanlineOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-50"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0,0,0,0.08) 2px,
          rgba(0,0,0,0.08) 4px
        )`,
      }}
    />
  );
}
```

Boot sequence uses a `useEffect` with `setTimeout` chains to print each line with a cursor blink, then transitions to the home screen by updating the store's `screen` field.

---

## Step 6 — Home Screen (Desktop OS)

> **User:** Before the DAW opens I want a fake OS desktop — the portfolio is a draggable file icon you double-click to open.

**Assistant:** Framer Motion's `drag` prop makes this trivial. The icon is a `<motion.button>` with `drag`, `dragConstraints={desktopRef}`, and `dragMomentum={false}`. Double-click triggers a loading overlay with an animated EQ visualizer and cycling phrases (`"compiling late nights..."`, `"rendering caffeine..."`) before calling `openWorkspace()`.

```typescript
<motion.button
  drag
  dragConstraints={desktopRef}
  dragMomentum={false}
  dragElastic={0}
  onDoubleClick={() => { if (!loading) setLoading(true); }}
  style={{ top: 24, left: 24, cursor: "grab" }}
>
  <Image src="/daw-icon.png" alt="avin_shetty.portfolio" ... />
  <span>avin_shetty.portfolio</span>
</motion.button>
```

---

## Step 7 — Bottom Mixer Panel

> **User:** When I click a clip on the timeline I want a panel to slide up with the full detail — like a mixer channel strip.

**Assistant:** The mixer panel uses `AnimatePresence` + a `y` slide-up transition. It renders whichever `TimelineItem` matches `selectedItemId` from the store.

```typescript
<AnimatePresence>
  {selected && (
    <motion.div
      key={selected.id}
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute bottom-0 left-0 right-0 bg-surface border-t border-grid"
    >
      <MixerChannelStrip item={selected} />
    </motion.div>
  )}
</AnimatePresence>
```

The channel strip shows: title, company, period, tech stack as pill badges (colored to match the clip), summary text, and links.

---

## Final Result

```
> npm run build

Route (app)                    Size
┌ ○ /                          4.2 kB
└ ○ /_not-found                0.9 kB

✓ Compiled successfully
```

The portfolio boots, scanlines flicker on, the desktop loads, you drag the `.portfolio` icon around, double-click it, watch the EQ bars pulse through `"building the future.flp..."` and `"debugging myself..."`, and the DAW workspace opens — timeline playing through Avin's career at 130 BPM.

**Tracks rendered:** 3 (experience / projects / design-team)  
**Clips:** 7 career items across 16 months  
**Plugins:** 23 skills across languages, frameworks, and dev tools

---

*Session generated with [Claude Code](https://claude.ai/code)*
