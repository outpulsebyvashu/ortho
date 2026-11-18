import { DEFAULTS } from "./defaults.js";
import { page, notFound } from "./render.js";

const enc = new TextEncoder();
const SEED = { "hero.mp4": "video/mp4", "stats.mp4": "video/mp4", "hero-poster.webp": "image/webp", "stats-poster.webp": "image/webp", "photo.webp": "image/webp" };
const OK_TYPE = /^(image\/(webp|jpeg|png|avif|gif|svg\+xml)|video\/(mp4|webm))$/;
const SEC = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "Permissions-Policy": "camera=(), microphone=(), geolocation=()" };
const json = (o, s = 200, h = {}) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...SEC, ...h } });

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function hmac(secret, data) { const k = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return b64(await crypto.subtle.sign("HMAC", k, enc.encode(data))); }
function safeEq(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
async function pbkdf(pw, salt) { const k = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]); return b64(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 100000 }, k, 256)); }

async function checkPw(env, pw) {
  const stored = await env.KV.get("pw");
  if (stored) { const [salt, h] = stored.split("$"); return safeEq(await pbkdf(pw, salt), h); }
  return safeEq(await hmac("x", pw), await hmac("x", env.ADMIN_PASSWORD || "\0"));
}
async function mkToken(env) { const exp = Date.now() + 7 * 864e5; const p = String(exp); return p + "." + (await hmac(env.SESSION_SECRET, p)); }
async function authed(req, env) {
  if (req.headers.get("X-Admin") !== "1") return false;
  const m = /(?:^|;\s*)adm=([^;]+)/.exec(req.headers.get("Cookie") || ""); if (!m) return false;
  const [p, s] = m[1].split("."); if (!p || !s || +p < Date.now()) return false;
  return safeEq(s, await hmac(env.SESSION_SECRET, p));
}

async function getContent(env) {
  const raw = await env.KV.get("content", { cacheTtl: 60 });
  if (!raw) return DEFAULTS;
  try { const c = JSON.parse(raw); return { ...DEFAULTS, ...c, media: { ...DEFAULTS.media, ...(c.media || {}) } }; } catch (e) { return DEFAULTS; }
}
async function ensureSeed(env, ctx) {
  const seeded = await env.KV.get("seeded", { cacheTtl: 300 }); if (seeded) return;
  for (const k of Object.keys(SEED)) {
    if (await env.KV.get("m:" + k, { type: "stream" })) continue;
    const r = await env.ASSETS.fetch("https://x/seed/" + k); if (!r.ok) continue;
    const buf = await r.arrayBuffer();
    await env.KV.put("m:" + k, buf, { metadata: { type: SEED[k], size: buf.byteLength, v: 1 } });
  }
  await env.KV.put("seeded", "1");
}
async function mediaList(env) {
  const out = []; let cursor;
  do { const r = await env.KV.list({ prefix: "m:", cursor }); r.keys.forEach((k) => out.push({ key: k.name.slice(2), ...(k.metadata || {}) })); cursor = r.list_complete ? null : r.cursor; } while (cursor);
  return out;
}
const clean = (s) => String(s).toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 80);

async function admin(req, env, url, ctx) {
  const p = url.pathname.replace("/admin/api/", ""), m = req.method;
  if (p === "login" && m === "POST") {
    if (req.headers.get("X-Admin") !== "1") return json({ error: "Bad request" }, 400);
    await new Promise((r) => setTimeout(r, 400));
    const b = await req.json().catch(() => ({}));
    if (!b.password || !(await checkPw(env, String(b.password)))) return json({ error: "Wrong password" }, 401);
    return json({ ok: true }, 200, { "Set-Cookie": `adm=${await mkToken(env)}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Strict` });
  }
  if (!(await authed(req, env))) return json({ error: "Signed out" }, 401);
  if (p === "logout") return json({ ok: true }, 200, { "Set-Cookie": "adm=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict" });
  if (p === "content" && m === "GET") { await ensureSeed(env, ctx); const raw = await env.KV.get("content"); let c = DEFAULTS; if (raw) { try { const x = JSON.parse(raw); c = { ...DEFAULTS, ...x, media: { ...DEFAULTS.media, ...(x.media || {}) } }; } catch (e) {} } return json({ content: c }); }
  if (p === "content" && m === "PUT") {
    const c = await req.json().catch(() => null);
    if (!c || !c.site || !c.contact || !Array.isArray(c.services) || !Array.isArray(c.blogs)) return json({ error: "Invalid content" }, 400);
    const slugs = new Set(["about", "services", "blogs", "contact", "ar-seva-foundation", "admin", "assets", "media"]);
    for (const b of c.blogs) { b.slug = clean(b.slug || b.title || "post").replace(/\./g, ""); if (!b.slug || slugs.has(b.slug)) return json({ error: "Blog slug '" + b.slug + "' is empty or reserved" }, 400); slugs.add(b.slug); }
    const s = JSON.stringify(c); if (s.length > 900000) return json({ error: "Content too large" }, 400);
    await env.KV.put("content", s); await env.KV.put("ver", String(Date.now()));
    return json({ ok: true });
  }
  if (p === "media" && m === "GET") return json({ items: await mediaList(env) });
  if (p.startsWith("media/") && m === "PUT") {
    const key = clean(decodeURIComponent(p.slice(6))); const type = (req.headers.get("Content-Type") || "").split(";")[0];
    if (!key || !OK_TYPE.test(type)) return json({ error: "Only images (webp, jpeg, png, avif) and mp4/webm video" }, 400);
    const buf = await req.arrayBuffer(); if (buf.byteLength > 24 * 1024 * 1024) return json({ error: "File over 24 MB" }, 400);
    const v = Date.now(); await env.KV.put("m:" + key, buf, { metadata: { type, size: buf.byteLength, v } });
    await caches.default.delete(new Request(url.origin + "/media/" + encodeURIComponent(key)));
    return json({ ok: true, key, v });
  }
  if (p.startsWith("media/") && m === "DELETE") {
    const key = clean(decodeURIComponent(p.slice(6))); const c = await getContent(env);
    if (Object.values(c.media).some((x) => x && x.k === key)) return json({ error: "File is in use" }, 400);
    await env.KV.delete("m:" + key); return json({ ok: true });
  }
  if (p === "password" && m === "POST") {
    const b = await req.json().catch(() => ({}));
    if (!(await checkPw(env, String(b.current || "")))) return json({ error: "Current password is wrong" }, 400);
    if (!b.next || String(b.next).length < 10) return json({ error: "New password must be at least 10 characters" }, 400);
    const salt = b64(crypto.getRandomValues(new Uint8Array(12))); await env.KV.put("pw", salt + "$" + (await pbkdf(String(b.next), salt)));
    return json({ ok: true });
  }
  if (p === "reset" && m === "POST") { await env.KV.delete("content"); await env.KV.put("ver", String(Date.now())); return json({ ok: true }); }
  return json({ error: "Not found" }, 404);
}

async function serveMedia(req, env, url, ctx) {
  const cache = caches.default, ck = new Request(url.origin + url.pathname + "?v=" + (url.searchParams.get("v") || "1"));
  let res = await cache.match(ck);
  if (!res) {
    const key = decodeURIComponent(url.pathname.slice(7));
    let r = await env.KV.getWithMetadata("m:" + key, { type: "arrayBuffer", cacheTtl: 3600 });
    if (!r.value && SEED[key]) { await ensureSeed(env, ctx); r = await env.KV.getWithMetadata("m:" + key, { type: "arrayBuffer" }); }
    if (!r.value) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    const meta = r.metadata || {};
    res = new Response(r.value, { headers: { "Content-Type": meta.type || "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable", "Accept-Ranges": "bytes", "ETag": '"' + (meta.v || 1) + '"', "X-Content-Type-Options": "nosniff", "Content-Length": String(r.value.byteLength) } });
    ctx.waitUntil(cache.put(ck, res.clone()));
  }
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("Range") || "");
  if (range && (range[1] || range[2])) {
    const buf = await res.arrayBuffer(), n = buf.byteLength;
    let s = range[1] === "" ? Math.max(0, n - +range[2]) : +range[1], e = range[1] === "" || range[2] === "" ? n - 1 : Math.min(+range[2], n - 1);
    if (s > e || s >= n) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + n } });
    const h = new Headers(res.headers); h.set("Content-Range", `bytes ${s}-${e}/${n}`); h.set("Content-Length", String(e - s + 1));
    return new Response(buf.slice(s, e + 1), { status: 206, headers: h });
  }
  if (req.headers.get("If-None-Match") === res.headers.get("ETag")) return new Response(null, { status: 304, headers: { ETag: res.headers.get("ETag") } });
  return res;
}

const ADMIN_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Site admin</title><link rel="stylesheet" href="/assets/admin.css"></head><body><div id="root"></div><script src="/assets/admin.js" defer></script></body></html>`;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url), path = url.pathname, v = env.ASSET_V || "1";
    if (path.startsWith("/admin/api/")) return admin(req, env, url, ctx);
    if (path === "/admin" || path === "/admin/") return new Response(ADMIN_HTML, { headers: { "Content-Type": "text/html;charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", ...SEC } });
    if (path.startsWith("/media/")) return serveMedia(req, env, url, ctx);
    if (path.startsWith("/assets/")) {
      const r = await env.ASSETS.fetch(new Request(url.origin + path.replace("/assets", ""), req));
      const h = new Headers(r.headers); h.set("Cache-Control", url.searchParams.has("v") ? "public, max-age=31536000, immutable" : "public, max-age=3600, must-revalidate"); return new Response(r.body, { status: r.status, headers: h });
    }
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
    let p = path; if (p !== "/" && !p.endsWith("/")) return Response.redirect(url.origin + p + "/" + url.search, 301);
    const ver = (await env.KV.get("ver", { cacheTtl: 30 })) || "0";
    const ck = new Request(url.origin + p + "?_=" + ver + "." + v), cache = caches.default;
    let res = await cache.match(ck);
    if (!res) {
      const c = await getContent(env);
      let html = page(c, v, p), status = 200; if (html == null) { html = notFound(c, v); status = 404; }
      res = new Response(html, { status, headers: { "Content-Type": "text/html;charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate", "ETag": 'W/"' + ver + "." + v + '"', ...SEC, "X-Frame-Options": "SAMEORIGIN", ...(c.site.noindex ? { "X-Robots-Tag": "noindex, nofollow" } : {}) } });
      if (status === 200) ctx.waitUntil(cache.put(ck, res.clone()));
    }
    if (req.headers.get("If-None-Match") === res.headers.get("ETag")) return new Response(null, { status: 304, headers: { ETag: res.headers.get("ETag") } });
    return res;
  },
};
