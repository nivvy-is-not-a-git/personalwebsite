/* ── Types ── */

export interface Skill {
  name: string;
  extension: ".vst" | ".dll" | ".so" | ".au";
  eq: number; // 0-100 — drives EQ bar height
}

export interface SkillCategory {
  id: string;
  label: string;
  items: Skill[];
}

export interface TimelineItem {
  id: string;
  track: "experience" | "projects";
  title: string;
  subtitle: string;
  period: string;
  /** Grid column span (visual width on the timeline) */
  span: number;
  /** Grid column start position */
  col: number;
  color: string;
  glowClass: string;
  selectedGlowClass: string;
  techStack: string[];
  achievements: string[];
  links?: { label: string; url: string }[];
  summary?: string;
  primaryUrl?: string;
}

export interface ProfileInfo {
  university: string;
  degree: string;
  major: string;
  graduationYear: string;
  bpm: string;
}

/* ── Profile ── */

export const profile: ProfileInfo = {
  university: "University of Waterloo",
  degree: "BASc",
  major: "Computer Engineering",
  graduationYear: "2029",
  bpm: "202.4",
};

/* ── Skills (Plugins Browser) ── */

export const skillCategories: SkillCategory[] = [
  {
    id: "languages",
    label: "Languages",
    items: [
      { name: "Python", extension: ".vst", eq: 92 },
      { name: "TypeScript", extension: ".vst", eq: 85 },
      { name: "JavaScript", extension: ".vst", eq: 88 },
      { name: "C", extension: ".vst", eq: 78 },
      { name: "C++", extension: ".vst", eq: 75 },
      { name: "SQL", extension: ".dll", eq: 88 },
      { name: "C#", extension: ".vst", eq: 65 },
      { name: "PHP", extension: ".vst", eq: 60 },
    ],
  },
  {
    id: "frameworks",
    label: "Frameworks & Libraries",
    items: [
      { name: "React", extension: ".vst", eq: 88 },
      { name: "Flask", extension: ".dll", eq: 82 },
      { name: "Node.js", extension: ".vst", eq: 80 },
      { name: "Next.js", extension: ".vst", eq: 82 },
      { name: "Three.js", extension: ".vst", eq: 70 },
      { name: "Pandas", extension: ".dll", eq: 85 },
      { name: "PyTorch", extension: ".dll", eq: 68 },
    ],
  },
  {
    id: "devtools",
    label: "Developer Tools",
    items: [
      { name: "Docker", extension: ".dll", eq: 78 },
      { name: "Git", extension: ".dll", eq: 92 },
      { name: "Snowflake", extension: ".dll", eq: 85 },
      { name: "dbt", extension: ".dll", eq: 80 },
      { name: "AWS", extension: ".so", eq: 75 },
      { name: "Airflow", extension: ".dll", eq: 78 },
      { name: "DuckDB", extension: ".dll", eq: 72 },
      { name: "STM32CubeIDE", extension: ".dll", eq: 70 },
    ],
  },
];

/* ── Timeline Items ── */

export const timelineItems: TimelineItem[] = [
  // ── Track 1: Experience ──
  {
    id: "exp-supercom",
    track: "experience",
    title: "Data Engineer",
    subtitle: "Super.com",
    period: "Jan 2026 – Present",
    span: 3,
    col: 10,
    color: "#00e5ff",
    glowClass: "glow-cyan",
    selectedGlowClass: "glow-selected-cyan",
    techStack: ["Python", "SQL", "Snowflake", "dbt", "Airflow", "AWS"],
    achievements: [],
    links: [{ label: "Company", url: "https://www.super.com" }],
    summary: "Description coming soon.",
    primaryUrl: "https://www.super.com",
  },
  {
    id: "exp-watai",
    track: "experience",
    title: "ML Engineer",
    subtitle: "WAT.ai",
    period: "Mar – Sep 2025",
    span: 5,
    col: 2,
    color: "#ff00ff",
    glowClass: "glow-magenta",
    selectedGlowClass: "glow-selected-magenta",
    techStack: ["Python", "Pandas", "PyTorch"],
    achievements: [],
    links: [{ label: "Organization", url: "https://watai.ca" }],
    summary: "Description coming soon.",
    primaryUrl: "https://watai.ca",
  },
  {
    id: "exp-loblaw",
    track: "experience",
    title: "Full Stack Engineer",
    subtitle: "Loblaw Companies",
    period: "May – Aug 2025",
    span: 3,
    col: 4,
    color: "#76ff03",
    glowClass: "glow-lime",
    selectedGlowClass: "glow-selected-lime",
    techStack: ["Python", "Flask", "JavaScript", "DuckDB", "SQL", "Pandas"],
    achievements: [],
    links: [{ label: "Company", url: "https://www.loblaw.ca" }],
    summary: "Description coming soon.",
    primaryUrl: "https://www.loblaw.ca",
  },
  // ── Track 2: Projects ──
  {
    id: "proj-collabify",
    track: "projects",
    title: "Collabify",
    subtitle: "Collaborative DJ",
    period: "Dec 2025",
    span: 2,
    col: 8,
    color: "#ff9100",
    glowClass: "glow-orange",
    selectedGlowClass: "glow-selected-orange",
    techStack: ["React", "JavaScript", "Flask"],
    achievements: [
      "Collaborative playlist voting app powered by the Spotify Web API with OAuth 2.0 PKCE auth",
    ],
    links: [{ label: "GitHub", url: "#" }],
    primaryUrl: "#",
  },
  {
    id: "proj-lifeline",
    track: "projects",
    title: "LIFELINE",
    subtitle: "Disaster Response App",
    period: "Feb 2026",
    span: 2,
    col: 11,
    color: "#ff4081",
    glowClass: "glow-pink",
    selectedGlowClass: "glow-selected-pink",
    techStack: ["React", "TypeScript", "Three.js", "Node.js"],
    achievements: [
      "Real-time disaster response platform with a Three.js globe, Solana transactions, and Gemini AI intel",
    ],
    links: [{ label: "GitHub", url: "#" }],
    primaryUrl: "#",
  },
  {
    id: "proj-seatbelt",
    track: "projects",
    title: "Seatbelt Detector",
    subtitle: "Child Safety Alarm",
    period: "Jan 2025",
    span: 3,
    col: 1,
    color: "#ffea00",
    glowClass: "glow-yellow",
    selectedGlowClass: "glow-selected-yellow",
    techStack: ["C", "STM32CubeIDE"],
    achievements: [
      "Dual-STM32 child car seat alarm using a strain gauge Wheatstone bridge and differential amplifier for seatbelt detection",
    ],
    links: [{ label: "Design Doc", url: "/seatbelt-detector.pdf" }],
    primaryUrl: "/seatbelt-detector.pdf",
  },
];

/* ── Helpers ── */

export function getAllSkills(): Skill[] {
  return skillCategories.flatMap((c) => c.items);
}

export function getSkillProficiency(techName: string): number {
  const skill = getAllSkills().find((s) => s.name === techName);
  return skill?.eq ?? 0;
}
