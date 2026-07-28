import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { conversationKeyboard, endConversation, openConversation } from "../conversation.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "جلسة جديدة", data: "chat:new", order: 10 });
registerMainMenuItem({ label: "إعدادات الجلسة", data: "chat:settings", order: 20 });

const composer = new Composer<Ctx>();

function settingsKeyboard(filterEnabled: boolean) {
  return inlineKeyboard([
    [inlineButton(filterEnabled ? "إيقاف الفلتر" : "تفعيل الفلتر", "chat:filter")],
    [inlineButton("15 دقيقة", "chat:duration:15"), inlineButton("30 دقيقة", "chat:duration:30"), inlineButton("60 دقيقة", "chat:duration:60")],
    [inlineButton("تغيير الترحيب", "chat:welcome")],
    [inlineButton("⬅️ القائمة", "menu:main")],
  ]);
}

function settingsText(filterEnabled: boolean, durationMinutes: number): string {
  return `إعدادات هذه الجلسة\n\nالفلتر: ${filterEnabled ? "مفعّل" : "متوقف"}\nمدة الجلسة: ${durationMinutes} دقيقة`;
}

composer.callbackQuery("chat:new", async (ctx) => {
  await ctx.answerCallbackQuery();
  const conversation = openConversation(ctx.session, ctx.from?.id ?? ctx.chat?.id ?? 0);
  conversation.history = [];
  await ctx.editMessageText(conversation.welcomeMessage, { reply_markup: conversationKeyboard(true) });
});

composer.callbackQuery("chat:end", async (ctx) => {
  await ctx.answerCallbackQuery();
  endConversation(ctx.session);
  await ctx.editMessageText("انتهت جلستك وحُذفت رسائلها المؤقتة.", { reply_markup: conversationKeyboard(false) });
});

composer.callbackQuery("chat:settings", async (ctx) => {
  await ctx.answerCallbackQuery();
  const conversation = openConversation(ctx.session, ctx.from?.id ?? ctx.chat?.id ?? 0);
  await ctx.editMessageText(settingsText(conversation.filterEnabled, conversation.durationMinutes), {
    reply_markup: settingsKeyboard(conversation.filterEnabled),
  });
});

composer.callbackQuery("chat:filter", async (ctx) => {
  await ctx.answerCallbackQuery();
  const conversation = openConversation(ctx.session, ctx.from?.id ?? ctx.chat?.id ?? 0);
  conversation.filterEnabled = !conversation.filterEnabled;
  await ctx.editMessageText(settingsText(conversation.filterEnabled, conversation.durationMinutes), {
    reply_markup: settingsKeyboard(conversation.filterEnabled),
  });
});

composer.on("callback_query:data", async (ctx, next) => {
  const match = /^chat:duration:(15|30|60)$/.exec(ctx.callbackQuery.data);
  if (!match) return next();
  await ctx.answerCallbackQuery();
  const conversation = openConversation(ctx.session, ctx.from?.id ?? ctx.chat?.id ?? 0);
  conversation.durationMinutes = Number(match[1]);
  await ctx.editMessageText(settingsText(conversation.filterEnabled, conversation.durationMinutes), {
    reply_markup: settingsKeyboard(conversation.filterEnabled),
  });
});

composer.callbackQuery("chat:welcome", async (ctx) => {
  await ctx.answerCallbackQuery();
  const conversation = openConversation(ctx.session, ctx.from?.id ?? ctx.chat?.id ?? 0);
  conversation.awaitingWelcomeMessage = true;
  await ctx.editMessageText("أرسل الآن رسالة الترحيب الجديدة لهذه الجلسة.", {
    reply_markup: inlineKeyboard([[inlineButton("إلغاء", "chat:settings")]]),
  });
});

export default composer;
