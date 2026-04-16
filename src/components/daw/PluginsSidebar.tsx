"use client";

import { skillCategories, profile } from "@/lib/data/careerData";
import { useUIStore } from "@/lib/store/uiStore";
import { motion, AnimatePresence } from "framer-motion";

const MIN_WIDTH = 144;
const MAX_WIDTH = 400;

export default function PluginsSidebar() {
  const expandedFolders = useUIStore((s) => s.expandedFolders);
  const toggleFolder = useUIStore((s) => s.toggleFolder);
  const ledActiveTech = useUIStore((s) => s.ledActiveTech);
  const width = useUIStore((s) => s.sidebarWidth);
  const setWidth = useUIStore((s) => s.setSidebarWidth);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    const onMove = (ev: MouseEvent) => {
      setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + ev.clientX - startX)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="shrink-0 bg-surface border-r border-grid flex flex-col relative" style={{ width }}>
      {/* Horizontal resize handle */}
      <div
        className="absolute top-0 right-0 bottom-0 w-1 z-10 cursor-col-resize group"
        onMouseDown={handleResizeMouseDown}
      >
        <div className="absolute inset-0 group-hover:bg-cyan/30 transition-colors" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-grid">
        <span className="text-sm">&#128194;</span>
        <span className="text-xs font-mono text-white font-bold tracking-wide uppercase">
          Plugins
        </span>
      </div>

      {/* Folder Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {skillCategories.map((category) => {
          const isOpen = expandedFolders[category.id] ?? false;

          return (
            <div key={category.id}>
              {/* Folder row */}
              <button
                onClick={() => toggleFolder(category.id)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-elevated transition-colors"
              >
                <span
                  className="text-muted text-[10px] transition-transform"
                  style={{
                    display: "inline-block",
                    transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                >
                  &#9654;
                </span>
                <span className="text-xs">&#128194;</span>
                <span className="text-xs font-mono text-white">
                  {category.label}
                </span>
              </button>

              {/* Items */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {category.items.map((skill) => {
                      const isActive = ledActiveTech.includes(skill.name);
                      return (
                        <div
                          key={skill.name}
                          className="flex items-center gap-2 pl-9 pr-3 py-1 hover:bg-elevated/60 transition-colors cursor-default"
                        >
                          <span className="text-[10px] text-cyan/60">
                            &#9835;
                          </span>
                          <span className="text-[11px] font-mono text-white">
                            {skill.name}
                          </span>
                          <span
                            className={`w-1 h-1 rounded-full shrink-0 ${
                              isActive ? "led-flicker" : ""
                            }`}
                            style={{
                              backgroundColor: isActive
                                ? "var(--color-led-green)"
                                : "var(--color-led-red)",
                              boxShadow: isActive
                                ? "0 0 4px var(--color-led-green), 0 0 8px rgba(0,230,118,0.4)"
                                : "0 0 3px rgba(255,23,68,0.3)",
                              opacity: isActive ? undefined : 0.55,
                            }}
                          />
                          <span className="text-[10px] text-muted ml-auto">
                            {skill.extension}
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Education Folder */}
        <EducationFolder />
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-grid">
        <div className="text-[10px] font-mono text-white">
          {skillCategories.reduce((n, c) => n + c.items.length, 0)} plugins
          loaded
        </div>
      </div>
    </div>
  );
}

function EducationFolder() {
  const expandedFolders = useUIStore((s) => s.expandedFolders);
  const toggleFolder = useUIStore((s) => s.toggleFolder);
  const isOpen = expandedFolders["education"] ?? false;

  const educationItems = [
    { icon: "\u{1F3EB}", label: profile.university },
    {
      icon: "\u{1F4DC}",
      label: `${profile.degree} ${profile.major}`,
    },
  ];

  return (
    <div className="mt-1 border-t border-grid/50 pt-1">
      <button
        onClick={() => toggleFolder("education")}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-elevated transition-colors"
      >
        <span
          className="text-muted text-[10px] transition-transform"
          style={{
            display: "inline-block",
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          &#9654;
        </span>
        <span className="text-xs">&#127891;</span>
        <span className="text-xs font-mono text-white">Education</span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {educationItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 pl-9 pr-3 py-1 hover:bg-elevated/60 transition-colors cursor-default"
              >
                <span className="text-[10px]">{item.icon}</span>
                <span className="text-[11px] font-mono text-white truncate">
                  {item.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
