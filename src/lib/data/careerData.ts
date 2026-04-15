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
  shortDescription?: string;
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
    techStack: ["Python", "SQL", "Snowflake", "dbt", "Airflow", "AWS", "Hightouch", "Fivetran",],
    achievements: [],
    links: [{ label: "Company", url: "https://www.super.com" }],
    summary: "Intensive data analysis/debugging, including resolving data latency issues by navigating PayPal-Fivetran API usage limits. Developed end-to-end data pipelines using Snowflake, Airflow, and dbt, streamlining financial data between transactional event data and formal accounting records. Devised new business logic and created easy-to-use front ends to automate data ingestion/reporting for accounting teams while leveraging Hightouch for data activation. Gained deep expertise in automating complex money flows, ensuring high-integrity transitions from raw customer transactions to final audit-ready accounting entries.",
    shortDescription: "Finance Automation.",
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
    summary: "Collaborated in the development of an NLP-driven personalized journalling platform. This involved reseraching and benchmarking various LLMs and sentiment analysis models (such as those available on Hugging Face), developing a synthetic journal entry generator, and more.",
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
    summary:
      "Revitalized Loblaw's supply chain reporting by migrating MS Access workflows to a high-performance Pandas/DuckDB stack and optimizing complex business logic. Re-engineered a legacy PHP codebase using Flask, Jinja, and JavaScript, delivering an optimized reporting dashboard that improved data visibility and operational efficiency for key business stakeholders. ", shortDescription: "Supply Chain Optimization.",
    primaryUrl: "https://www.loblaw.ca",
  },
  // ── Track 2: Projects ──
  {
    id: "proj-pawgress",
    track: "projects",
    title: "PawGress",
    subtitle: "Habit Tracker",
    period: "Jan 2025",
    span: 2,
    col: 1,
    color: "#b388ff",
    glowClass: "glow-violet",
    selectedGlowClass: "glow-selected-violet",
    techStack: ["React Native", "TypeScript", "JavaScript", "Node.js"],
    achievements: [
      "Developed a gamified habit tracker with Cohere personalization + AsyncStorage.",
    ],
    primaryUrl: "https://github.com/nivvy-is-not-a-git/Habit-Tracker",
  },
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
    links: [{ label: "GitHub", url: "https://github.com/nivvy-is-not-a-git/Collabify" }],
    primaryUrl: "https://github.com/nivvy-is-not-a-git/Collabify",
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
    links: [{ label: "GitHub", url: "https://github.com/nivvy-is-not-a-git/Lifeline" }],
    primaryUrl: "https://github.com/nivvy-is-not-a-git/Collabify",
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
