import { LEVELS, PROJECT_COLORS } from '../constants/index.js';

export function calcStats(projects, notes) {
  const totalTasks = projects.reduce((s, p) => s + p.tasks.length, 0);
  const done = projects.reduce((s, p) => s + p.tasks.filter(t => t.status === "done").length, 0);
  const inProgress = projects.reduce((s, p) => s + p.tasks.filter(t => t.status === "in_progress").length, 0);
  const blocked = projects.reduce((s, p) => s + p.tasks.filter(t => t.status === "blocked").length, 0);
  const planned = projects.reduce((s, p) => s + p.tasks.filter(t => t.status === "planned").length, 0);
  const ideas = projects.reduce((s, p) => s + p.tasks.filter(t => t.status === "idea").length, 0);
  const projectsWithTasks = projects.filter(p => p.tasks.length > 0).length;
  const maxDoneInProject = Math.max(0, ...projects.map(p => p.tasks.filter(t => t.status === "done").length));
  const hasCleanProject = projects.some(p => p.tasks.length > 0 && p.tasks.every(t => t.status === "done"));
  const withDesc = projects.reduce((s, p) => s + p.tasks.filter(t => t.description).length, 0);

  // XP calculation
  const xp = (done * 50) + (inProgress * 15) + (totalTasks * 10) + (notes.length * 10) + (projects.length * 20) + (withDesc * 5);

  // Level
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) { currentLevel = LEVELS[i]; nextLevel = LEVELS[i + 1] || null; break; }
  }
  const xpInLevel = xp - currentLevel.minXP;
  const xpNeeded = nextLevel ? nextLevel.minXP - currentLevel.minXP : 0;
  const levelProgress = nextLevel ? Math.min(xpInLevel / xpNeeded, 1) : 1;

  return { totalTasks, done, inProgress, blocked, planned, ideas, projects: projects.length, notes: notes.length, projectsWithTasks, maxDoneInProject, hasCleanProject, xp, currentLevel, nextLevel, xpInLevel, xpNeeded, levelProgress, completionRate: totalTasks ? Math.round((done / totalTasks) * 100) : 0 };
}

export const gid = () => Math.random().toString(36).substr(2, 9);
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

export function buildThemeVars(mode, atmId, pcId) {
  const pc = PROJECT_COLORS.find(c => c.id === pcId) || PROJECT_COLORS[0];
  const dk = mode === "dark";
  return {
    "--surface": dk ? "rgba(22,22,26,0.88)" : "rgba(255,255,255,0.88)",
    "--surface2": dk ? "rgba(30,30,36,0.92)" : "rgba(240,240,244,0.92)",
    "--surface3": dk ? "rgba(42,42,50,0.92)" : "rgba(228,228,235,0.92)",
    "--surface-modal": dk ? "#252530" : "#fcfcfe",
    "--glass": dk ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
    "--border": dk ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    "--border2": dk ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
    "--border-modal": dk ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.13)",
    "--text": dk ? "#EDEDEF" : "#1A1A1E",
    "--text2": dk ? "#94949E" : "#6B6B76",
    "--text3": dk ? "#5A5A66" : "#9A9AA6",
    "--accent": pc.hex,
    "--accent-soft": pc.hex + (dk ? "18" : "14"),
    "--accent-glow": pc.hex + "22",
    "--accent-text": dk ? pc.hex : pc.lightText,
    "--shadow": dk ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.08)",
    "--backdrop-val": dk ? "blur(16px) saturate(1.4)" : "blur(16px) saturate(1.2)",
    "--st-idea": "#EAB308", "--st-planned": "#6366F1", "--st-in_progress": "#F97316",
    "--st-blocked": "#EF4444", "--st-done": "#22C55E", "--st-archived": "#71717A",
  };
}

export const stC = id => `var(--st-${id})`;

export function renderMd(text) {
  if (!text) return "";
  let h = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:700;margin:14px 0 6px;color:var(--text)">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:700;margin:14px 0 6px;color:var(--text)">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:700;margin:16px 0 8px;color:var(--text)">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:var(--surface3);padding:2px 6px;border-radius:4px;font-size:12px;font-family:monospace">$1</code>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border2);margin:16px 0"/>')
    .replace(/^>\s?(.+)$/gm, '<blockquote style="border-left:3px solid var(--accent);padding:4px 12px;margin:8px 0;color:var(--text2);font-style:italic">$1</blockquote>')
    .replace(/^- \[x\] (.+)$/gm, '<div style="margin:4px 0;text-decoration:line-through;opacity:0.5">☑ $1</div>')
    .replace(/^- \[ \] (.+)$/gm, '<div style="margin:4px 0">☐ $1</div>')
    .replace(/^- (.+)$/gm, '{{UL}}$1{{/UL}}')
    .replace(/^(\d+)\. (.+)$/gm, '{{OL}}$2{{/OL}}');
  h = h.replace(/({{UL}}.*?{{\/UL}}\n?)+/g, m => {
    const items = m.replace(/{{UL}}(.*?){{\/UL}}\n?/g, '<li style="margin:4px 0">$1</li>');
    return `<ul style="list-style-type:disc;padding-left:24px;margin:8px 0">${items}</ul>`;
  });
  h = h.replace(/({{OL}}.*?{{\/OL}}\n?)+/g, m => {
    const items = m.replace(/{{OL}}(.*?){{\/OL}}\n?/g, '<li style="margin:4px 0">$1</li>');
    return `<ol style="list-style-type:decimal;padding-left:24px;margin:8px 0">${items}</ol>`;
  });
  h = h.replace(/\n\n/g, "<br/><br/>").replace(/\n/g, "<br/>");
  return h;
}