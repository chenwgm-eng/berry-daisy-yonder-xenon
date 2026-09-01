import { useSyncExternalStore } from "react";

export type Locale = "en" | "zh";

const STORAGE_KEY = "gstack-locale";

let currentLocale: Locale = "en";
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(next: Locale): void {
  if (next === currentLocale) return;
  currentLocale = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage unavailable */
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  }
  for (const fn of listeners) fn();
}

/**
 * Read the stored choice after mount. SSR and the first client render stay
 * English, so hydration matches; the stored choice swaps in immediately after.
 */
export function initLocale(): void {
  if (typeof window === "undefined") return;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "zh" || stored === "en") setLocale(stored);
  } catch {
    /* ignore */
  }
}

export function subscribeLocale(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const en = {
  "nav.team": "The team",

  "landing.tagline": "Virtual engineering company",
  "landing.heroA": "That is not a copilot.",
  "landing.heroB": "That is a team.",
  "landing.heroSub":
    "GStack is Garry Tan's workflow — office hours, CEO review, architecture, design, QA, security, ship — turned into agents you can summon. One builder. A company's worth of judgment.",
  "landing.ideaLabel": "What are you building",
  "landing.ideaPlaceholder": "What are you building? Paste a messy idea, a plan, or a bug.",
  "landing.shortcutHint": "⌘ / Ctrl + Enter to open the floor",
  "landing.openSprint": "Open a sprint",
  "landing.specialists": "Specialists on the floor",
  "landing.fullRoster": "Full roster",
  "landing.openSprints": "Open sprints",
  "landing.searchPlaceholder": "Search sprints…",
  "landing.searchAria": "Search sprints",
  "landing.noMatch": "No sprints match your search.",
  "landing.pin": "Pin sprint",
  "landing.unpin": "Unpin sprint",
  "landing.rename": "Rename sprint",
  "landing.delete": "Delete sprint",
  "landing.deleteConfirm": "Delete \"{title}\"? This cannot be undone.",
  "landing.footer": "Inspired by the open-source gstack skill pack. Agents recommend. You decide.",

  "war.restoring": "Restoring the floor…",
  "war.gone": "This sprint is gone.",
  "war.backToFloor": "Back to the floor",
  "war.rename": "Rename sprint",
  "war.team": "Team",
  "war.artifacts": "Artifacts",
  "war.close": "Close",
  "war.briefing": "Briefing",
  "war.thinking": "thinking",
  "war.couldNotReach": "Could not reach the specialist. {message}",
  "war.fellQuiet": "The floor went quiet.",
  "war.retryKickoff": "Retry kickoff",
  "war.runBoard": "Run review board",
  "war.talkingTo": "talking to {slash}",
  "war.messagePlaceholder": "Message {name}…  /office-hours  /ceo  /eng",
  "war.stop": "Stop generating",
  "war.send": "Send",
  "war.retry": "retry",
  "war.answerAs": "answer as…",
  "war.noArtifacts": "No artifacts yet. Run a specialist or the board.",
  "war.artifactsHint": "Artifacts land here when a specialist writes a review or design doc.",
  "war.copyMarkdown": "Copy markdown",
  "war.downloadMd": "Download as .md",

  "team.roster": "Roster",
  "team.title": "Ten specialists. One floor.",
  "team.sub":
    "Each agent is a gstack role with a job, a slash command, and a refusal to do someone else's work. Summon them from a sprint.",
  "team.floor": "Floor",

  "store.quotaFull": "Local storage is full — delete an old sprint to keep saving.",
} as const;

export type I18nKey = keyof typeof en;

const zh: Record<I18nKey, string> = {
  "nav.team": "团队",

  "landing.tagline": "虚拟工程公司",
  "landing.heroA": "这不是一个副驾驶。",
  "landing.heroB": "这是一整支团队。",
  "landing.heroSub":
    "GStack 把 Garry Tan 的工作流——办公室答疑、CEO 评审、架构、设计、QA、安全、发布——变成了随叫随到的智能体。一个人，配齐一家公司的判断力。",
  "landing.ideaLabel": "你在构建什么",
  "landing.ideaPlaceholder": "你在构建什么？贴上一个粗糙的想法、一份计划，或一个 bug。",
  "landing.shortcutHint": "⌘ / Ctrl + Enter 开工",
  "landing.openSprint": "开启冲刺",
  "landing.specialists": "在席专家",
  "landing.fullRoster": "完整名册",
  "landing.openSprints": "进行中的冲刺",
  "landing.searchPlaceholder": "搜索冲刺…",
  "landing.searchAria": "搜索冲刺",
  "landing.noMatch": "没有匹配的冲刺。",
  "landing.pin": "置顶冲刺",
  "landing.unpin": "取消置顶",
  "landing.rename": "重命名冲刺",
  "landing.delete": "删除冲刺",
  "landing.deleteConfirm": "删除「{title}」？此操作不可撤销。",
  "landing.footer": "灵感来自开源 gstack 技能包。智能体给建议，你来做决定。",

  "war.restoring": "正在恢复现场…",
  "war.gone": "这个冲刺已不存在。",
  "war.backToFloor": "回到大厅",
  "war.rename": "重命名冲刺",
  "war.team": "团队",
  "war.artifacts": "交付物",
  "war.close": "关闭",
  "war.briefing": "任务简报",
  "war.thinking": "思考中",
  "war.couldNotReach": "暂时联系不上这位专家。{message}",
  "war.fellQuiet": "现场突然安静了。",
  "war.retryKickoff": "重试开场",
  "war.runBoard": "召开评审会",
  "war.talkingTo": "正在与 {slash} 对话",
  "war.messagePlaceholder": "发消息给 {name}…  /office-hours  /ceo  /eng",
  "war.stop": "停止生成",
  "war.send": "发送",
  "war.retry": "重试",
  "war.answerAs": "换专家重答…",
  "war.noArtifacts": "还没有交付物。让某位专家或评审会产出一份。",
  "war.artifactsHint": "专家写出评审或设计文档后，交付物会出现在这里。",
  "war.copyMarkdown": "复制 Markdown",
  "war.downloadMd": "下载 .md",

  "team.roster": "名册",
  "team.title": "十位专家。一间作战室。",
  "team.sub":
    "每个智能体都是 gstack 的一个角色：有自己的职责、斜杠命令，也绝不越俎代庖。在冲刺中召唤他们。",
  "team.floor": "大厅",

  "store.quotaFull": "本地存储已满——删除一个旧冲刺后才能继续保存。",
};

function interpolate(text: string, vars?: Record<string, string>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => vars[name] ?? m);
}

/** Non-reactive translator — usable anywhere, reads the locale at call time. */
export function t(key: I18nKey, vars?: Record<string, string>, locale: Locale = currentLocale): string {
  const table = locale === "zh" ? zh : en;
  return interpolate(table[key] ?? en[key], vars);
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, () => "en" as Locale);
}

/** Reactive translator for components — re-renders on locale change. */
export function useT(): (key: I18nKey, vars?: Record<string, string>) => string {
  const locale = useLocale();
  return (key, vars) => t(key, vars, locale);
}
