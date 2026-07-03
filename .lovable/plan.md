# Coder v2 — Full agent inline in the chat page

الهدف: تجربة زي Replit / Lovable جوّه صفحة الشات نفسها — بدون أي مودال أو لوحة منفصلة. الذكاء يخطط، يكتب ملفات، يشغّل أوامر bash/python في ترمنال حقيقي، ويعرض أزرار ربط GitHub/Supabase مع زر "تخطي"، وكل ده يظهر كرسائل/كروت جوّه المحادثة.

## سلوك المستخدم

1. المستخدم يكتب طلبه في وضع Coder ويبعت زي أي رساله.
2. رساله الـassistant تتبني تدريجياً على شكل "كروت أدوات" (tool cards) inline:
   - خطة (todo list قابلة للتحديث)
   - كارت لكل ملف يتكتب/يتعدل (path + diff + زر معاينة)
   - كارت ترمنال لكل أمر (bash/python) مع stdout/stderr مباشر
   - كارت "اربط GitHub" و"اربط Supabase" مع زر Skip
   - كارت المعاينة (Preview) في الآخر يفتح المشروع
3. لو المستخدم بعت رساله تانيه، الأجنت يكمّل على نفس workspace المشروع (نفس الـthread).

## بنية تقنية

### Backend — `supabase/functions/coder-agent/index.ts`
- SSE endpoint يستقبل: `messages`, `projectId`, `mode`.
- يستخدم Lovable AI Gateway (`google/gemini-3-flash-preview`) عبر AI SDK بأدوات (tools):
  - `todo_write({ items })` — يحدّث خطة العمل.
  - `write_file({ path, content })` — يضيف/يحدّث ملف في الـvirtual workspace.
  - `edit_file({ path, search, replace })` — تعديل نقطي.
  - `read_file({ path })` — قراءة ملف موجود.
  - `list_files()` — سرد.
  - `bash({ cmd })` — ينفّذ في sandbox (Deno subprocess داخل الـedge function مع قيود؛ التنفيذ الحقيقي عبر Piston public API أو `deno run` sandboxed).
  - `python({ code })` — عبر Piston.
  - `request_integration({ kind: "github"|"supabase", reason })` — يطلع كارت للمستخدم.
- `stopWhen: stepCountIs(50)`. كل tool call يتبعت للـclient كـSSE event.
- الـworkspace files تتخزن في جدول `coder_projects` + `coder_files` (RLS بالـuser).

### Frontend — تعديلات جوّه `ChatPage`
- لما `chatMode === "code"`: بدل ما `sendChat` يروح على `chat-alibaba`، يروح على `coder-agent` ويقرأ SSE.
- كل event يضاف كـ`part` على رسالة الـassistant الحالية:
  - `type: "tool-todo"` → `<TodoCard/>`
  - `type: "tool-file"` → `<FileCard/>` (اسم الملف + عدد الأسطر + زر عرض)
  - `type: "tool-bash"` / `"tool-python"` → `<TerminalCard/>` streamed
  - `type: "tool-integration"` → `<IntegrationCard/>` مع زرين: Connect / Skip
  - `type: "tool-preview"` → `<PreviewCard/>` يفتح المشروع في iframe (نفس نظام `publishProject` الحالي)
- كومبوننتات جديدة تحت `src/components/coder/inline/`:
  - `TodoCard.tsx`, `FileCard.tsx`, `TerminalCard.tsx`, `IntegrationCard.tsx`, `PreviewCard.tsx`
- تعديل `ChatMessage.tsx` عشان يرندر الـparts دي بالترتيب.

### أزرار الربط
- `IntegrationCard` بيستخدم:
  - GitHub → يفتح Lovable GitHub connect flow (زر بيوجّه للـ `/integrations/github`).
  - Supabase → المشروع أصلاً متربط، فيعرض "متصل ✓" أو زر التخطي.
- زر "Skip" بيبعت رسالة رجوع للأجنت `{ skipped: "github" }` عشان يكمّل من غير.

### تخزين workspace
- جدول جديد `coder_projects(id, user_id, thread_id, name, created_at)`.
- جدول `coder_files(id, project_id, path, content, updated_at)`.
- GRANTS + RLS scoped by `auth.uid()`.
- Preview يقرأ الملفات من الـDB ويشغّلها من خلال runtime الـBabel-in-browser الموجود حالياً في `buildReactRuntime.ts`.

### التنفيذ الفعلي للأوامر
- `bash` و`python` يتنفّذوا عبر [Piston API العام](https://emkc.org/api/v2/piston) (مجاني، بدون auth). Output يتبعت streamed للـclient.
- محدود بـ10s per command، output مقصوص عند 20KB.

## خطوات التنفيذ

1. إنشاء migration للجداول `coder_projects` + `coder_files` مع GRANTS + RLS.
2. كتابة `supabase/functions/coder-agent/index.ts` بالـAI SDK + tools + SSE.
3. إنشاء كومبوننتات inline تحت `src/components/coder/inline/`.
4. تعديل `ChatPage`: توجيه `chatMode === "code"` للـcoder-agent + دمج SSE events كـparts.
5. تعديل `ChatMessage.tsx` لرندر الـparts الجديدة.
6. حذف `KimiCoderPanel.tsx` و`kimiCoder.ts` القديمين.
7. اختبار: طلب "اعمل موقع عن أم كلثوم" — أتأكد إن الخطة، الملفات، الترمنال، وأزرار الربط بتظهر inline في الشات.

## ملاحظات
- الحجم كبير (edge function ~400 سطر + 5 كومبوننتات + تعديلات على ChatPage/ChatMessage). محتاج تأكيد قبل البدء.
- الترمنال الحقيقي جوّه edge function مش ممكن (Deno.subprocess محدود)؛ Piston هو الحل المعتاد لـsandboxed exec وشغّال زي ما Replit/Lovable بيعملوا.
- الأدوات كلها ملك ميغسي (مفيش ذكر لأي مزود).
