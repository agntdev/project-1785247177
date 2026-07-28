import type { Session } from "./bot.js";
import { inlineButton, inlineKeyboard } from "./toolkit/index.js";

type Conversation = NonNullable<Session["conversation"]>;

const DEFAULT_WELCOME = "أهلًا، هذه محادثة عربية مؤقتة. اكتب ما تريد وسأساعدك.";
const BLOCKED_KEYWORDS = ["قنبلة", "تفجير", "قتل شخص", "انتحار"];
const WARNING_KEYWORDS = ["سلاح", "مخدرات", "إيذاء"];
let clock: () => number = () => Date.now();

export function now(): number {
  return clock();
}

export function setConversationClock(nextClock: () => number): () => void {
  const previous = clock;
  clock = nextClock;
  return () => {
    clock = previous;
  };
}

function defaultConversation(userId: number): Conversation {
  const current = now();
  return {
    id: `session-${userId}-${current}`,
    lastActivity: current,
    history: [],
    filterEnabled: true,
    durationMinutes: 30,
    welcomeMessage: DEFAULT_WELCOME,
  };
}

export function openConversation(session: Session, userId: number): Conversation {
  if (!session.conversation || expiredConversation(session.conversation)) {
    session.conversation = defaultConversation(userId);
  }
  session.conversation.lastActivity = now();
  return session.conversation;
}

export function expiredConversation(conversation: Conversation): boolean {
  return now() - conversation.lastActivity >= conversation.durationMinutes * 60_000;
}

export function endConversation(session: Session): void {
  delete session.conversation;
}

export function addHistory(
  conversation: Conversation,
  role: "user" | "assistant",
  text: string,
): void {
  conversation.history.push({ role, text: text.slice(0, 1_000), at: now() });
  if (conversation.history.length > 20) conversation.history.splice(0, conversation.history.length - 20);
  conversation.lastActivity = now();
}

export function shouldBlock(text: string): boolean {
  const normalized = text.toLowerCase();
  return BLOCKED_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function shouldWarn(text: string): boolean {
  const normalized = text.toLowerCase();
  return WARNING_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function safetyReply(level: "blocked" | "warning"): string {
  return level === "blocked"
    ? "لا أستطيع المساعدة في محتوى قد يسبب أذى. إذا كان هناك خطر مباشر، تواصل مع خدمات الطوارئ المحلية أو شخص تثق به الآن."
    : "يمكنني المساعدة بمعلومات آمنة وعامة. أخبرني بما تريد تجنّبه أو دعنا نبحث عن خيار لا يسبب أذى.";
}

export function replyToArabicMessage(text: string): string {
  if (/^(مرحبا|مرحبًا|اهلا|أهلا|السلام عليكم)/i.test(text)) {
    return "أهلًا بك. ما الموضوع الذي تريد التحدث عنه؟";
  }
  if (text.endsWith("؟") || text.endsWith("?")) {
    return "أفهم سؤالك. أرسل التفاصيل المهمة وسأساعدك على ترتيب الإجابة بالعربية.";
  }
  return "وصلت رسالتك. أخبرني بما تحتاجه بالتفصيل وسأتابع معك بالعربية.";
}

export function conversationKeyboard(active: boolean) {
  return inlineKeyboard([
    active ? [inlineButton("إنهاء الجلسة", "chat:end")] : [inlineButton("بدء جلسة", "chat:new")],
    [inlineButton("إعدادات الجلسة", "chat:settings")],
  ]);
}
