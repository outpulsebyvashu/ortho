const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const br = (s) => esc(s).replace(/\n/g, "<br>");
const telOf = (p) => "+" + String(p).replace(/[^\d]/g, "");
const A = (h, t, x) => `<a href="${h}"${x || ""}>${t}</a>`;
const LISTINGS = ["https://www.practo.com/mysore/doctor/arun-gr-orthopedist", "https://www.practo.com/mysore/clinic/dr-aruns-ortho-and-sports-injury-clinic-vijayanagar", "https://www.justdial.com/Mysore/Dr-Arun-Gr-Dr-Aruns-Ortho-And-Sports-Injury-Clinic-Opposite-Kangaroo-Care-Hospital-Vijaynagar-Mysore/0821PX821-X821-230207200024-L5R1_BZDET", "https://www.lybrate.com/mysore/doctors-for-orthopedic-surgery", "https://www.hexahealth.com/mysore/doctor/dr-arun-g-r-orthopedic-doctor", "https://drarunsorthoclinic.com/"];
const lst = (c) => (Array.isArray(c.contact.listings) ? c.contact.listings : LISTINGS).filter(Boolean);
const hostName = (u) => { try { return new URL(u).hostname.replace(/^www\./, "").replace(/\.(com|in)$/, ""); } catch (e) { return u; } };
const NAVL = [["/about/", "About"], ["/services/", "Services"], ["/blogs/", "Blogs"], ["/contact/", "Contact"], ["/ar-seva-foundation/", "AR Seva Foundation"]];
const LITE = "(function(){var d=document.documentElement,n=navigator,c=n.connection||{};var lo=(n.deviceMemory&&n.deviceMemory<=2)||(n.hardwareConcurrency&&n.hardwareConcurrency<=2)||c.saveData||/(^|-)2g$/.test(c.effectiveType||'')||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);if(lo)d.className+=' lite'})();";

export function mu(c, key) { const m = c.media[key] || {}; return m.k ? `/media/${encodeURIComponent(m.k)}?v=${encodeURIComponent(m.v || "1")}` : ""; }
const two = (a, b) => `${esc(a)}<br><em>${esc(b)}</em>`;
function splitTwo(t) { const w = String(t).split(" "); if (w.length < 2) return esc(t); let best = 1, bd = 1e9; for (let i = 1; i < w.length; i++) { const d = Math.abs(w.slice(0, i).join(" ").length - w.slice(i).join(" ").length); if (d < bd) { bd = d; best = i; } } return two(w.slice(0, best).join(" "), w.slice(best).join(" ")); }

let CUR = { path: "/", blog: null };
const baseOf = (c) => String(c.site.url || "https://ortho.outpulse.company").replace(/\/$/, "");
function hoursSpec(h) {
  const out = []; const m = String(h || "").match(/(\d{1,2}:\d{2}\s*[ap]m)\s*[–-]\s*(\d{1,2}:\d{2}\s*[ap]m)\s*&\s*(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/i);
  const t = (x) => { const r = /(\d{1,2}):(\d{2})\s*([ap]m)?/i.exec(x); let H = +r[1]; if (r[3]) { if (/pm/i.test(r[3]) && H < 12) H += 12; if (/am/i.test(r[3]) && H === 12) H = 0; } return String(H).padStart(2, "0") + ":" + r[2]; };
  if (m) { const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; out.push({ "@type": "OpeningHoursSpecification", dayOfWeek: days, opens: t(m[1]), closes: t(m[2]) }); const e = t(m[3].length < 6 ? m[3] + " pm" : m[3]); out.push({ "@type": "OpeningHoursSpecification", dayOfWeek: days, opens: e, closes: t(m[4].length < 6 ? m[4] + " pm" : m[4]) }); }
  return out;
}
function schema(c, title, desc) {
  const B = baseOf(c), url = B + CUR.path, lines = String(c.contact.address).split("\n").map((x) => x.trim()).filter(Boolean);
  const pc = (/(\d{6})/.exec(c.contact.address) || [])[1];
  const clinic = { "@type": ["MedicalClinic", "LocalBusiness"], "@id": B + "/#clinic", name: c.site.clinic, url: B + "/", telephone: telOf(c.contact.phone), email: c.contact.email, image: B + mu(c, "photo"), logo: B + "/assets/logo.webp", medicalSpecialty: "Orthopedic", description: c.hero.sub, sameAs: [c.contact.instagram].concat(lst(c)).filter(Boolean), openingHoursSpecification: hoursSpec(c.contact.hours), address: { "@type": "PostalAddress", streetAddress: lines.slice(0, -1).join(", "), addressLocality: c.site.city, addressRegion: "Karnataka", postalCode: pc, addressCountry: "IN" }, areaServed: c.site.city, founder: { "@id": B + "/#doctor" } };
  const doc = { "@type": ["Physician", "Person"], "@id": B + "/#doctor", name: c.site.doctor, medicalSpecialty: "Orthopedic", jobTitle: "Orthopaedic and Sports Injury Surgeon", worksFor: { "@id": B + "/#clinic" }, url: B + "/about/", hasCredential: (c.surgeon.credentials || []).map((x) => ({ "@type": "EducationalOccupationalCredential", name: x })) };
  const g = [clinic, doc, { "@type": "WebSite", "@id": B + "/#site", url: B + "/", name: c.site.clinic, publisher: { "@id": B + "/#clinic" }, inLanguage: "en-IN" }];
  if (CUR.path !== "/") {
    const items = [{ "@type": "ListItem", position: 1, name: "Home", item: B + "/" }];
    if (CUR.blog) items.push({ "@type": "ListItem", position: 2, name: "Blogs", item: B + "/blogs/" });
    items.push({ "@type": "ListItem", position: items.length + 1, name: title.split(" | ")[0], item: url });
    g.push({ "@type": "BreadcrumbList", itemListElement: items });
  }
  if (CUR.blog) g.push({ "@type": "BlogPosting", headline: CUR.blog.title, description: CUR.blog.excerpt, mainEntityOfPage: url, author: { "@id": B + "/#doctor" }, publisher: { "@id": B + "/#clinic" }, image: B + mu(c, "photo"), inLanguage: "en-IN", dateModified: CUR.blog.date || undefined, datePublished: CUR.blog.date || undefined });
  return '<script type="application/ld+json">' + JSON.stringify({ "@context": "https://schema.org", "@graph": g }).replace(/</g, "\\u003c") + "</script>";
}

function shell(c, v, title, desc, main, opts) {
  opts = opts || {};
  const tel = telOf(c.contact.phone), book = c.contact.bookUrl || "/contact/", clinic = esc(c.site.clinic);
  const B = baseOf(c), canon = B + CUR.path, ogimg = B + mu(c, "heroPoster");
  const robots = c.site.noindex ? '<meta name="robots" content="noindex,nofollow">' : '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">';
  const seo = `<link rel="canonical" href="${canon}"><link rel="icon" href="/assets/logo.webp" type="image/webp"><meta name="geo.region" content="IN-KA"><meta name="geo.placename" content="${esc(c.site.city)}"><meta name="author" content="${esc(c.site.doctor)}">
<meta property="og:type" content="${CUR.blog ? "article" : "website"}"><meta property="og:site_name" content="${clinic}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canon}"><meta property="og:image" content="${ogimg}"><meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${ogimg}">` + schema(c, title, desc);
  const preload = opts.home ? `<link rel="preload" as="image" href="${mu(c, "heroPoster")}">` : "";
  const fonts = "https://fonts.googleapis.com/css2?family=DM+Serif+Text:ital@0;1&family=Gilda+Display&display=swap";
  return `<!DOCTYPE html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${robots}<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="theme-color" content="#b79144">${seo}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>${preload}
<link rel="stylesheet" href="/assets/site.css?v=${v}">
<link href="${fonts}" rel="stylesheet" media="print" onload="this.media='all'"><noscript><link href="${fonts}" rel="stylesheet"></noscript>
<script>${LITE}</script></head><body>
<div class="topbar"><div class="wrap"><span>${esc(c.site.doctor)} · ${clinic}, ${esc(c.site.city)}</span><span><a href="tel:${tel}">${esc(c.contact.phone)}</a> &nbsp; <a class="btn" style="padding:6px 14px;font-size:13px" href="${esc(book)}">Book an Appointment</a></span></div></div>
<header><div class="wrap"><a class="logo" href="/" aria-label="${esc(c.site.doctor)} home"><img src="/assets/logo.webp?v=${v}" alt="${esc(c.site.logo)}" width="204" height="30"></a><button class="burger" aria-label="Menu" aria-controls="mm" onclick="document.getElementById('mm').classList.toggle('open')"><span></span><span></span><span></span></button><nav aria-label="Primary"><ul>${NAVL.map(([u, t]) => `<li><a class="nav-btn" href="${u}">${t}</a></li>`).join("")}</ul></nav></div>
<div class="mm" id="mm">${A("/", "Home")}${NAVL.map(([u, t]) => A(u, t)).join("")}</div></header>
${main}
<footer id="footer"><div class="wrap"><div class="cols"><div><h4>Quick Links</h4><span class="fl">${A("/", "Home")}${NAVL.map(([u, t]) => A(u, t)).join("")}</span></div><div><h4>${clinic}</h4>${br(c.contact.address)}<br>${br(c.contact.hours)}</div><div><h4>Get in Touch</h4>${A("tel:" + tel, esc(c.contact.phone))}<br>${A("mailto:" + esc(c.contact.email), esc(c.contact.email))}<br><br>${A("https://wa.me/" + esc(c.contact.whatsapp), "WhatsApp", ' target="_blank" rel="noopener"')} · ${A(esc(c.contact.instagram), "Instagram", ' target="_blank" rel="noopener"')}</div></div><p class="onl" style="margin-top:24px;font-size:13px;opacity:.85">Also find us on: ${[...new Set(lst(c).map((u) => [hostName(u), u]).map((x) => x[0]))].map((n) => A(lst(c).find((u) => hostName(u) === n), esc(n === "drarunsorthoclinic" ? "Clinic website" : n.charAt(0).toUpperCase() + n.slice(1)), ' target="_blank" rel="noopener"')).join(" · ")}</p><p style="margin-top:16px">© ${new Date().getUTCFullYear()} ${clinic}</p><p class="built"><a href="https://outpulse.company" target="_blank" rel="noopener">BUILT BY OUTPULSE.COMPANY</a></p></div></footer>
<div class="cookie" id="ck" hidden><b>Cookies</b><p>We use one small cookie to remember this choice. No tracking or advertising cookies are set.</p><button class="p" data-v="accepted">Accept</button><button data-v="essential">Essential only</button></div>
<script src="/assets/site.js?v=${v}" defer></script></body></html>`;
}

export function home(c, v) {
  const tel = telOf(c.contact.phone), book = esc(c.contact.bookUrl || "/contact/"), ph = esc(c.contact.phone);
  const li = (a) => a.map((x) => `<li>${esc(x)}</li>`).join("");
  const photo = mu(c, "photo");
  const img = (alt) => `<img alt="${esc(alt)}" src="${photo}" width="640" height="800" loading="lazy" decoding="async">`;
  const nlp = (t) => String(t).split("\n").filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("");
  const main = `
<div class="hero"><video class="hero-bg" data-src="${mu(c, "heroVideo")}" poster="${mu(c, "heroPoster")}" muted loop playsinline preload="none"></video><div class="wrap"><h1>${two(c.hero.title1, c.hero.title2)}</h1><p>${esc(c.hero.sub)}</p><div class="cta"><a class="btn" href="tel:${tel}">Call ${ph}</a><a class="btn ghost" href="${book}">Book an Appointment</a></div></div></div>
<section><div class="wrap" style="text-align:center;max-width:820px"><h2>${two(c.welcome.title1, c.welcome.title2)}</h2><p>${esc(c.welcome.text)}</p><a class="btn" href="/about/">Learn More About Us</a></div></section>
<section class="alt"><div class="wrap two"><div><h2>${two(c.individual.title1, c.individual.title2)}</h2>${nlp(c.individual.text)}</div>${img("Patient care")}</div></section>
<section class="alt stats-sec"><video class="sec-bg" data-src="${mu(c, "statsVideo")}" poster="${mu(c, "statsPoster")}" muted loop playsinline preload="none"></video><div class="wrap"><h2 style="text-align:center">Our Core<br><em>Values</em></h2><div class="stats four">${c.values.map((x) => `<div><b>${esc(x.t)}</b>${esc(x.d)}</div>`).join("")}</div></div></section>
<section><div class="wrap two">${img(c.site.doctor)}<div><h2>About<br><em>The Surgeon</em></h2><p>${esc(c.surgeon.text)}</p><ul class="links">${li(c.surgeon.credentials)}</ul><p><a class="btn" href="/about/">Read More</a></p></div></div></section>
<section class="press-sec"><div class="wrap"><h2>Our<br><em>Services</em></h2><div class="car" id="car">${c.services.map((s) => `<div class="card slide"><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p>${A("/services/", "Learn more →")}</div>`).join("")}</div><div class="car-ctl"><button aria-label="Previous" onclick="carGo('car',-1)">&#8592;</button><span id="dots"></span><button aria-label="Next" onclick="carGo('car',1)">&#8594;</button></div><p><a href="/services/">View all services →</a></p></div></section>
<section class="alt"><div class="wrap two"><div><h2>${two(c.feature.title1, c.feature.title2)}</h2><p>${esc(c.feature.text)}</p><ul class="links">${li(c.feature.points)}</ul><p><a class="btn" href="${esc(c.feature.link)}">${esc(c.feature.button)}</a></p></div>${img("Knee care")}</div></section>
<section><div class="wrap"><h2 style="text-align:center">Visit<br><em>the Clinic</em></h2><p style="text-align:center">${br(c.contact.address)}</p><div class="hrs"><table><tr><th>Hours</th></tr>${String(c.contact.hours).split("\n").map((l) => `<tr><td>${esc(l)}</td></tr>`).join("")}</table></div></div></section>
<section class="alt"><div class="wrap two">${img("Physiotherapy")}<div><h2>${two(c.sports.title1, c.sports.title2)}</h2><p>${esc(c.sports.text)}</p><a class="btn" href="${book}">Book an Appointment</a></div></div></section>
<section><div class="wrap" style="max-width:820px;text-align:center"><h2>${two(c.tourism.title1, c.tourism.title2)}</h2><p>${esc(c.tourism.text)}</p><a class="btn" href="${esc(c.tourism.link)}">${esc(c.tourism.button)}</a></div></section>
<section class="alt"><div class="wrap"><h2 style="text-align:center">Your Visit,<br><em>Step by Step</em></h2><div class="steps">${c.steps.map((s) => `<div>${esc(s)}</div>`).join("")}</div><p style="text-align:center;margin-top:28px"><a class="btn" href="${book}">Book an Appointment</a></p></div></section>
<section><div class="wrap"><h2>What Our<br><em>Patients Say</em></h2><div class="cards">${c.testimonials.map((t) => `<div class="card"><h3>${esc(t.n)}</h3><p>${esc(t.t)}</p></div>`).join("")}</div></div></section>
<section class="alt"><div class="wrap two"><div><h2>AR Seva<br><em>Foundation</em></h2><p>${esc(c.seva.text)}</p><ul class="links left">${li(c.seva.points)}</ul><p><a class="btn" href="/ar-seva-foundation/">Learn More</a></p></div>${img("AR Seva Foundation")}</div></section>
<section class="press-sec"><div class="wrap"><h2>Our<br><em>Blog</em></h2><div class="cards two">${c.blogs.slice(0, 4).map((b) => `<div class="card"><small>${esc(b.category)}</small><h3>${A("/" + esc(b.slug) + "/", esc(b.title))}</h3></div>`).join("")}</div><p><a href="/blogs/">View all posts →</a></p></div></section>
<section class="closing" id="appointment"><div class="wrap"><h2>Visit Dr. Arun's<br><em>Ortho &amp; Sports Injury Clinic</em></h2><p class="btns"><a class="btn" href="tel:${tel}">${ph}</a><a class="btn ghost" href="${book}">Book an Appointment</a></p><p>${esc(String(c.contact.hours).split("\n")[0])}</p></div></section>`;
  return shell(c, v, `Orthopedic Surgeon in Mysore (${c.site.city}) | ${c.site.doctor}`, `${c.site.doctor} is an orthopedic and sports injury surgeon in Mysore (${c.site.city}). Robotic joint replacement, ACL reconstruction, arthroscopy and fracture care at ${c.site.clinic}. Call ${c.contact.phone}.`, main, { home: true });
}

export function inner(c, v, title, crumbs, body, lead, side) {
  const tel = telOf(c.contact.phone), book = esc(c.contact.bookUrl || "/contact/");
  const crumb = [["/", "Home"]].concat(crumbs).map(([u, t]) => (u ? A(u, esc(t)) : esc(t))).join(" / ");
  const sideBox = side ? `<div class="box"><h3>${esc(side.title)}</h3>${side.items.map(([u, t]) => `<a class="rl" href="${u}">${esc(t)}</a>`).join("")}</div>` : "";
  const main = `<main><section class="page-hero"><div class="wrap"><div class="crumbs">${crumb}</div><h1>${splitTwo(title)}</h1><p class="lead">${esc(lead)}</p><a class="btn" href="${book}">Book an Appointment</a></div></section>
<section class="page-body"><div class="wrap"><div class="grid"><article>${body}</article><aside class="side">${sideBox}<div class="box"><h3>Need help?</h3><p>Call <a href="tel:${tel}">${esc(c.contact.phone)}</a> or visit us.</p><p>${br(c.contact.hours)}</p><a class="btn" href="${book}">Contact us</a></div></aside></div></div></section>
<section class="closing2"><div class="wrap"><h2>Ready to take the next step?</h2><a class="btn" href="${book}">Book an Appointment</a></div></section></main>`;
  const m = META[CUR.path]; const t = m ? m[0] : CUR.blog ? `${title} | Dr. Arun GR, Mysore` : `${title} | Orthopedic Surgeon in Mysore`; const d = m ? m[1] : (CUR.blog && CUR.blog.excerpt ? CUR.blog.excerpt : lead).slice(0, 158); return shell(c, v, t, d, main);
}

const META = {
  "/about/": ["About Dr. Arun GR | Orthopedic Surgeon in Mysore", "Meet Dr. Arun GR, fellowship-trained orthopedic and sports injury surgeon in Mysore (Mysuru). Qualifications, experience and approach to joint care."],
  "/services/": ["Orthopedic Treatments in Mysore | Joint Replacement, ACL, Arthroscopy", "Knee and hip replacement, ACL reconstruction, shoulder arthroscopy, fracture care and sports injury treatment in Vijayanagar, Mysore. Book a consultation."],
  "/blogs/": ["Orthopedic Health Blog | Dr. Arun GR, Mysore", "Plain-language articles on knee and hip replacement, ACL injuries, sports injuries and recovery from an orthopedic surgeon in Mysore."],
  "/contact/": ["Contact & Book Appointment | Orthopedic Clinic Vijayanagar, Mysore", "Dr. Arun's Ortho & Sports Injury Clinic, Kalidasa Road, Vijayanagar 1st Stage, Mysuru 570017. Call, WhatsApp or book an appointment. Mon–Sat."],
  "/ar-seva-foundation/": ["AR Seva Foundation | Orthopedic Care for All in Mysore", "AR Seva Foundation by Dr. Arun GR makes orthopedic care reachable for people in Mysuru who need support. Learn how to get help or contribute."]
};
export function paths(c) { return ["/", "/about/", "/services/", "/blogs/", "/contact/", "/ar-seva-foundation/"].concat(c.blogs.map((b) => "/" + b.slug + "/")); }
export function page(c, v, path) {
  CUR = { path, blog: c.blogs.find((x) => "/" + x.slug + "/" === path) || null };
  const tel = telOf(c.contact.phone);
  const NAVSIDE = { title: "Explore", items: NAVL };
  const li = (a) => "<ul>" + a.map((x) => `<li>${esc(x)}</li>`).join("") + "</ul>";
  if (path === "/") return home(c, v);
  if (path === "/about/") return inner(c, v, "About Us", [[null, "About"]], c.pages.about + "<h2>Credentials</h2>" + li(c.surgeon.credentials) + "<h2>Core values</h2>" + c.values.map((x) => `<p><strong>${esc(x.t)}:</strong> ${esc(x.d)}</p>`).join(""), "Fellowship-trained orthopaedic care in " + c.site.city + ".", NAVSIDE);
  if (path === "/services/") return inner(c, v, "Our Services", [[null, "Services"]], "<h2>All your ortho needs at one place</h2>" + c.services.map((s) => `<h2>${esc(s.t)}</h2><p>${esc(s.d)}</p>`).join("") + "<h2>Not sure what you need?</h2><p>Call us, book an appointment, or walk into the clinic for a closer look and a treatment recommendation.</p>", "All your ortho needs at one place.", NAVSIDE);
  if (path === "/blogs/") return inner(c, v, "Blogs", [[null, "Blogs"]], `<div class="cards2" style="grid-template-columns:1fr 1fr">${c.blogs.map((b) => `<a href="/${esc(b.slug)}/"><small>${esc(b.category)}</small><br><strong>${esc(b.title)}</strong><br>${esc(b.excerpt)}</a>`).join("")}</div>`, "Articles and patient education.", NAVSIDE);
  if (path === "/contact/") return inner(c, v, "Contact Us", [[null, "Contact"]], `<h2>${esc(c.site.clinic)}</h2><p>${br(c.contact.address)}</p><h2>Hours</h2><p>${br(c.contact.hours)}</p><h2>Call or message</h2><p>Phone: ${A("tel:" + tel, esc(c.contact.phone))}<br>WhatsApp: ${A("https://wa.me/" + esc(c.contact.whatsapp), "Chat on WhatsApp", ' target="_blank" rel="noopener"')}<br>Email: ${A("mailto:" + esc(c.contact.email), esc(c.contact.email))}<br>Instagram: ${A(esc(c.contact.instagram), "Instagram", ' target="_blank" rel="noopener"')}</p><p>Reserve a time slot, then walk in at that time for prioritized treatment at no extra cost.</p><h2>Find us</h2><p>${A("https://www.google.com/maps/search/?api=1&amp;query=" + encodeURIComponent(c.contact.address.replace(/\n/g, ", ")), "Open in Google Maps", ' target="_blank" rel="noopener"')}</p>`, "We are open Monday to Saturday, closed on Sunday.", NAVSIDE);
  if (path === "/ar-seva-foundation/") return inner(c, v, "AR Seva Foundation", [[null, "AR Seva Foundation"]], c.pages.seva + `<h2>Contact</h2><p>Phone / WhatsApp: ${esc(c.contact.phone)}<br>${br(c.contact.address)}</p>`, "Making orthopaedic care reachable for everyone.", NAVSIDE);
  const b = c.blogs.find((x) => "/" + x.slug + "/" === path);
  if (b) return inner(c, v, b.title, [["/blogs/", "Blogs"], [null, b.title.split(":")[0]]], b.body, b.excerpt, { title: "More reading", items: c.blogs.filter((x) => x !== b).map((x) => ["/" + x.slug + "/", x.title]).concat([["/contact/", "Contact us"]]) });
  return null;
}

export function notFound(c, v) {
  CUR = { path: "/404/", blog: null };
  return inner(c, v, "Page not found", [], '<p>The page you are looking for does not exist.</p><p><a class="btn" href="/">Back to home</a></p>', "Let us help you find what you need.", { title: "Explore", items: NAVL });
}
