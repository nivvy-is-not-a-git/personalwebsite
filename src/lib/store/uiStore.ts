import { create } from "zustand";

export type PowerState = "off" | "booting" | "on";
export type ScreenView = "home" | "workspace";
export type TransportState = "stopped" | "playing" | "paused";
export type RecordState = "idle" | "rendering" | "done";

interface UIStore {
  powerState: PowerState;
  screenView: ScreenView;
  bootTarget: ScreenView;
  selectedItemId: string | null;
  expandedFolders: Record<string, boolean>;

  // Transport
  transportState: TransportState;
  playheadProgress: number; // 0..1 normalized across 12-col grid
  mutedTracks: Record<string, boolean>; // keyed by track name
  activeItemIds: string[]; // items currently under the playhead (unmuted)
  ledActiveTech: string[]; // tech names driving sidebar plugin LEDs

  // Record / Quick Export
  recordState: RecordState;
  recordProgress: number; // 0..1

  // Crossfader (visible only during overlap)
  crossfaderValue: number; // 0 = top track, 1 = bottom track

  // BPM
  bpm: number;

  togglePower: () => void;
  setPowerState: (state: PowerState) => void;
  setScreenView: (view: ScreenView) => void;
  openWorkspaceFromHome: () => void;
  closeWorkspace: () => void;
  selectItem: (id: string | null) => void;
  toggleFolder: (folderId: string) => void;

  // Transport actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  setPlayheadProgress: (p: number) => void;
  setActiveItemIds: (ids: string[]) => void;
  setLedActiveTech: (tech: string[]) => void;
  toggleMuteTrack: (track: string) => void;

  // Record actions
  setRecordState: (s: RecordState) => void;
  setRecordProgress: (p: number) => void;

  // Crossfader
  setCrossfaderValue: (v: number) => void;

  // BPM
  setBpm: (v: number) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  powerState: "off",
  screenView: "home",
  bootTarget: "home",
  selectedItemId: null,
  expandedFolders: { languages: true, frameworks: false, devtools: false },

  transportState: "stopped",
  playheadProgress: 0,
  mutedTracks: {},
  activeItemIds: [],
  ledActiveTech: [],

  recordState: "idle",
  recordProgress: 0,

  crossfaderValue: 0.5,

  bpm: 202.4,

  togglePower: () => {
    const current = get().powerState;
    if (current === "off") {
      set({ powerState: "booting", selectedItemId: null });
    } else {
      set({
        powerState: "off",
        selectedItemId: null,
        transportState: "stopped",
        playheadProgress: 0,
        activeItemIds: [],
        ledActiveTech: [],
        recordState: "idle",
        recordProgress: 0,
      });
    }
  },

  setPowerState: (state) => set({ powerState: state }),

  setScreenView: (view) => set({ screenView: view }),

  openWorkspaceFromHome: () =>
    set({ screenView: "workspace", bootTarget: "workspace" }),

  closeWorkspace: () =>
    set({
      screenView: "home",
      bootTarget: "home",
      selectedItemId: null,
      transportState: "stopped",
      playheadProgress: 0,
      activeItemIds: [],
      ledActiveTech: [],
      recordState: "idle",
      recordProgress: 0,
    }),

  selectItem: (id) =>
    set({ selectedItemId: id === get().selectedItemId ? null : id }),

  toggleFolder: (folderId) =>
    set((s) => ({
      expandedFolders: {
        ...s.expandedFolders,
        [folderId]: !s.expandedFolders[folderId],
      },
    })),

  // Transport
  play: () => set({ transportState: "playing", selectedItemId: null }),
  pause: () => set({ transportState: "paused" }),
  stop: () =>
    set({
      transportState: "stopped",
      playheadProgress: 0,
      activeItemIds: [],
      ledActiveTech: [],
      selectedItemId: null,
    }),
  setPlayheadProgress: (p) => set({ playheadProgress: p }),
  setActiveItemIds: (ids) => set({ activeItemIds: ids }),
  setLedActiveTech: (tech) => set({ ledActiveTech: tech }),
  toggleMuteTrack: (track) =>
    set((s) => ({
      mutedTracks: { ...s.mutedTracks, [track]: !s.mutedTracks[track] },
    })),

  // Record
  setRecordState: (s) => set({ recordState: s }),
  setRecordProgress: (p) => set({ recordProgress: p }),

  // Crossfader
  setCrossfaderValue: (v) => set({ crossfaderValue: v }),

  // BPM
  setBpm: (v) => set({ bpm: Math.max(60, Math.min(999, v)) }),
}));
