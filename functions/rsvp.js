// Cloudflare Pages Function: POST /rsvp  {name, kind:"yes"|"no"}  →  сообщение Яне в Telegram.
// Токен и чат берутся из переменных окружения проекта Pages (Settings → Variables and Secrets):
//   TG_TOKEN — токен бота (Secret), TG_CHAT — chat_id Яны. В коде и репозитории токена нет.
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export function onRequestOptions() { return new Response(null, { status: 204, headers: CORS }); }

export async function onRequestPost({ request, env }) {
  try {
    if (!env.TG_TOKEN || !env.TG_CHAT) return json({ ok: false, error: "not configured" }, 503);
    const body = await request.json().catch(() => ({}));
    const kind = body.kind === "yes" ? "yes" : body.kind === "no" ? "no" : null;
    if (!kind) return json({ ok: false, error: "bad kind" }, 400);
    const who = String(body.name || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 40) || "Гость без именной ссылки";
    const when = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const text = (kind === "yes" ? "✅ " + who + " — придёт!" : "❌ " + who + " — не сможет прийти") + "\n" + when;
    const r = await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: env.TG_CHAT, text }),
    });
    const j = await r.json().catch(() => ({}));
    return json({ ok: !!j.ok }, j.ok ? 200 : 502);
  } catch (e) {
    return json({ ok: false }, 500);
  }
}
