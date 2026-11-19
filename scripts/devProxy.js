/**
 * DEV ONLY. Lets the citation drawer show the cited websites inside its frame.
 *
 * These sites send X-Frame-Options / frame-ancestors, so browsers refuse to frame them. This Metro middleware fetches the page
 * on the developer's machine, drops the framing headers, points relative links at the real site with a <base> tag and
 * serves it from localhost:  GET /__proxy?url=https://host/...
 *
 * It serves only the cited hosts listed below, exists only while `expo start` runs, and is not part of the exported `dist`
 * build (which shows a card with a link instead).
 */
const ALLOWED_HOSTS = [
  "pib.gov.in",
  "ibef.org",
  "economictimes.com",
  "indiatimes.com", // economictimes.com redirects here
];

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const allowed = (host) =>
  ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));

const DROP_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "content-encoding", // fetch has already decoded the body
  "content-length",
  "transfer-encoding",
  "connection",
  "set-cookie",
  "strict-transport-security",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
]);

function page(res, status, text) {
  res.statusCode = status;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(
    `<!doctype html><meta charset="utf-8"><body style="font:13px system-ui;color:#525866;display:grid;place-items:center;height:100vh;margin:0;text-align:center;padding:24px">${text}</body>`,
  );
}

async function handle(req, res) {
  let target;
  try {
    target = new URL(
      new URL(req.url, "http://localhost").searchParams.get("url"),
    );
  } catch {
    return page(res, 400, "Missing or invalid url.");
  }
  if (target.protocol !== "https:" || !allowed(target.hostname))
    return page(res, 403, `${target.hostname} is not served by the dev proxy.`);
  try {
    const up = await fetch(target, {
      redirect: "follow",
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        "accept-language": "en-IN,en;q=0.9",
      },
      signal: AbortSignal.timeout(20000),
    });
    const finalUrl = up.url || target.href;
    if (!allowed(new URL(finalUrl).hostname))
      return page(
        res,
        403,
        "That page redirected to a site the dev proxy does not serve.",
      );
    res.statusCode = up.status;
    up.headers.forEach((value, key) => {
      if (!DROP_HEADERS.has(key.toLowerCase())) res.setHeader(key, value);
    });
    const type = up.headers.get("content-type") || "";
    if (!type.includes("text/html"))
      return res.end(Buffer.from(await up.arrayBuffer()));
    let html = await up.text();
    // A CSP can also arrive as a <meta>; remove it so it cannot block the page's own assets.
    html = html.replace(
      /<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi,
      "",
    );
    // Relative links and assets resolve against the real site, not localhost.
    const base = `<base href="${finalUrl}">`;
    html = /<head[^>]*>/i.test(html)
      ? html.replace(/<head[^>]*>/i, (m) => `${m}${base}`)
      : `${base}${html}`;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end(html);
  } catch (err) {
    page(
      res,
      502,
      `Could not reach ${target.hostname}.<br><small>${String(err && err.message)}</small>`,
    );
  }
}

/** Metro `enhanceMiddleware` wrapper: handles /__proxy and passes everything else on. */
module.exports = (middleware) => (req, res, next) =>
  req.url && req.url.startsWith("/__proxy")
    ? handle(req, res)
    : middleware(req, res, next);
