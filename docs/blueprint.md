# مساعد دردشة عربي — Bot specification

**Archetype:** custom

**Voice:** neutral-friendly — write every user-facing message, button label, error, and empty state in this voice.

بوت تلغرام ذكي يوفر محادثة عربية مؤقتة وعامة، مع فلترة أولية للمحتوى الضار. يبدأ المستخدم الجلسة عبر /start أو رسالة عادية، ويتم حذف المحادثة بعد انتهاء الجلسة أو بعد 30 دقيقة من عدم النشاط.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- مستخدمي تلغرام في العالم العربي

## Success criteria

- الرد السريع والدقيق بالعربية على جميع الرسائل
- إنهاء الجلسة تلقائيًا بعد 30 دقيقة من عدم النشاط
- فلترة المحتوى الضار بشكل فعال

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — فتح الجلسة وعرض رسالة الترحيب
- **رسالة عادية** (message, actor: user, command: /message) — بدء محادثة جديدة

## Flows

### بدء الجلسة
_Trigger:_ /start أو رسالة عادية

1. التحقق من وجود جلسة نشطة
2. إنشاء جلسة جديدة إذا لم تكن موجودة
3. إرسال رسالة ترحيب بالعربية

_Data touched:_ User, Conversation session

### المحادثة العادية
_Trigger:_ رسالة من المستخدم

1. التحقق من جلسة نشطة
2. فلترة المحتوى الضار
3. توليد الرد بالعربية
4. إرسال الرد

_Data touched:_ Conversation session, Moderation filter

### إنهاء الجلسة
_Trigger:_ /end أو 30 دقيقة من عدم النشاط

1. إنهاء الجلسة
2. حذف بيانات الجلسة المؤقتة

_Data touched:_ Conversation session

### التعامل مع الأخطاء
_Trigger:_ حدث خطأ

1. إرسال رسالة ودية بالعربية تشرح الخطأ
2. عرض خيار إعادة المحاولة

_Data touched:_ Conversation session

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User** _(retention: none)_ — الحساب على تلغرام للمستخدم
  - fields: Telegram user ID
- **Conversation session** _(retention: session)_ — جلسة محادثة مؤقتة تُخزن أثناء النشاط
  - fields: session ID, last activity timestamp, message history
- **Moderation filter** _(retention: none)_ — فلتر لمحتوى ضار
  - fields: blocked keywords, warning keywords

## Integrations

- **Telegram** (required) — Bot API messaging
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- تفعيل/تعطيل الفلتر
- تغيير مدة الجلسة
- تغيير رسالة الترحيب

## Permissions & privacy

- المحادثات مؤقتة ولا تُخزن بعد انتهاء الجلسة
- الفلتر يحمي من المحتوى الضار دون مراقبة محادثات المستخدمين

## Edge cases

- الرد على ملفات نصية كبيرة
- التعامل مع رسائل تحتوي على محتوى ضار
- إعادة تشغيل الجلسة بعد انتهاءها تلقائيًا

## Required tests

- اختبار بدء الجلسة عبر /start ورسالة عادية
- اختبار فلترة المحتوى الضار
- اختبار إنهاء الجلسة تلقائيًا بعد 30 دقيقة

## Assumptions

- الرد بالعربية فقط مقبول من المستخدمين
- المحادثات المؤقتة تفي بمتطلبات الخصوصية
- الفلتر الأساسي يكفي لحماية المستخدمين
