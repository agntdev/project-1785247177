import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  addHistory,
  conversationKeyboard,
  endConversation,
  expiredConversation,
  now,
  openConversation,
  replyToArabicMessage,
  safetyReply,
  shouldBlock,
  shouldWarn,
} from "../conversation.js";

const composer = new Composer<Ctx>();

composer.on("message:text", async (ctx, next) => {
  const text = ctx.message.text.trim();
  if (/^\/(start|help)(?:@\w+)?(?:\s|$)/i.test(text)) return next();

  if (/^\/end(?:@\w+)?(?:\s|$)/i.test(text)) {
    endConversation(ctx.session);
    await ctx.reply("انتهت جلستك وحُذفت رسائلها المؤقتة.", { reply_markup: conversationKeyboard(false) });
    return;
  }

  const existing = ctx.session.conversation;
  if (existing?.awaitingWelcomeMessage) {
    if (text.length > 500) {
      await ctx.reply("رسالة الترحيب طويلة. أرسل رسالة أقصر من 500 حرف.");
      return;
    }
    existing.welcomeMessage = text;
    existing.awaitingWelcomeMessage = false;
    existing.lastActivity = now();
    await ctx.reply("تم حفظ رسالة الترحيب لهذه المحادثة.", { reply_markup: conversationKeyboard(true) });
    return;
  }

  if (!existing || expiredConversation(existing)) {
    const conversation = openConversation(ctx.session, ctx.from?.id ?? ctx.chat?.id ?? 0);
    await ctx.reply(conversation.welcomeMessage, { reply_markup: conversationKeyboard(true) });
    return;
  }

  existing.lastActivity = now();
  if (existing.filterEnabled && shouldBlock(text)) {
    await ctx.reply(safetyReply("blocked"), { reply_markup: conversationKeyboard(true) });
    return;
  }
  if (existing.filterEnabled && shouldWarn(text)) {
    addHistory(existing, "user", text);
    const reply = safetyReply("warning");
    addHistory(existing, "assistant", reply);
    await ctx.reply(reply, { reply_markup: conversationKeyboard(true) });
    return;
  }

  addHistory(existing, "user", text);
  const reply = replyToArabicMessage(text);
  addHistory(existing, "assistant", reply);
  await ctx.reply(reply, { reply_markup: conversationKeyboard(true) });
});

composer.on("message:document", async (ctx) => {
  const existing = ctx.session.conversation;
  const conversation = !existing || expiredConversation(existing)
    ? openConversation(ctx.session, ctx.from?.id ?? ctx.chat?.id ?? 0)
    : existing;
  conversation.lastActivity = now();
  await ctx.reply(
    "وصلني الملف. لا أستطيع قراءة محتوى الملفات المرفقة هنا؛ الصق الجزء الذي تريد مناقشته وسأساعدك بالعربية.",
    { reply_markup: conversationKeyboard(true) },
  );
});

export default composer;
