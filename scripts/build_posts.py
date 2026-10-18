#!/usr/bin/env python3
"""Build one real HTML page per blog post, plus feed.xml and sitemap entries.

Run from the repository root after adding or editing a post:

    pip install markdown
    python3 scripts/build_posts.py

Output: blog/<slug>/index.html for every post in posts/index.json,
feed.xml, and the post URLs inside sitemap.xml.
"""
import json, re, html, datetime, pathlib, sys
import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://anand-ambastha.github.io/"
AUTHOR = "Anand Kumar"
PAGES = "research projects publications blog about contact cv".split()


BASE_KEYWORDS = ["Anand Kumar", "Anand Ambastha", "Anand Verma"]
QUANTUM_KEYWORDS = ["quantum key distribution", "QKD", "quantum communication"]

def keywords(tags, text=""):
    extra = QUANTUM_KEYWORDS if re.search(r"qkd|quantum|satellite|optisystem", " ".join(tags) + " " + text, re.I) else []
    seen, out = set(), []
    for k in list(tags) + BASE_KEYWORDS + extra:
        k = str(k).strip()
        if k and k.lower() not in seen:
            seen.add(k.lower()); out.append(k)
    return ", ".join(out)

def parse(path):
    raw = path.read_text(encoding="utf-8")
    meta, body = {}, raw
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n?", raw, re.S)
    if m:
        body = raw[m.end():]
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                v = v.strip()
                if v.startswith("[") and v.endswith("]"):
                    v = [t.strip() for t in v[1:-1].split(",") if t.strip()]
                meta[k.strip()] = v
    return meta, body


def protect_math(text):
    store = []
    def keep(m):
        store.append(m.group(0))
        return "\u0001MATH%d\u0001" % (len(store) - 1)
    text = re.sub(r"\$\$.+?\$\$", keep, text, flags=re.S)
    text = re.sub(r"(?<![\\$])\$(?!\s)[^$\n]+?(?<!\s)\$(?!\d)", keep, text)
    return text, store


def restore_math(h, store):
    for i, s in enumerate(store):
        h = h.replace("\u0001MATH%d\u0001" % i, html.escape(s, quote=False))
    return h


def fix_links(h):
    # ../post/#slug  ->  ../slug/   (page lives at /blog/<slug>/)
    h = re.sub(r'href="\.\./post/#([^"]+)"', r'href="../\1/"', h)
    # ../projects/ etc. were written relative to /post/; we are one level deeper
    h = re.sub(r'href="\.\./(%s)/"' % "|".join(PAGES), r'href="../../\1/"', h)
    # images are written relative to posts/
    h = re.sub(r'<img ([^>]*?)src="(?!https?:|data:|/)(?:\./)?([^"]+)"',
               r'<img \1src="../../posts/\2" loading="lazy"', h)
    # table wrappers and code blocks, to match the client-side renderer
    h = re.sub(r"<table>", '<div class="table-wrap"><table>', h)
    h = h.replace("</table>", "</table></div>")
    def code(m):
        lang = re.search(r'class="language-([\w+-]+)"', m.group(0))
        return ('<div class="codeblock"><div class="codebar"><span>%s</span>'
                '<button type="button">Copy</button></div>%s</div>') % (lang.group(1) if lang else "text", m.group(0))
    h = re.sub(r"<pre>.*?</pre>", code, h, flags=re.S)
    return h


def text_of(h):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", h))).strip()


def fmt(d):
    try:
        return datetime.date.fromisoformat(d).strftime("%-d %B %Y")
    except Exception:
        return d


nav_links = "".join('<a href="../../%s/"%s>%s</a>' % (p, ' aria-current="page"' if p == "blog" else "", p.title())
                    for p in "research projects publications blog about".split())
FOOT = (ROOT / "about" / "index.html").read_text(encoding="utf-8")
FOOT = re.search(r'  <footer class="site">.*?</footer>\n', FOOT, re.S).group(0)
FOOT = (FOOT.replace('href="../', 'href="../../'))

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} | Anand Kumar</title>
<!-- seo:start -->
<meta name="description" content="{desc}">
<meta name="keywords" content="{kw}">
<meta name="author" content="Anand Kumar">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#000000">
<link rel="icon" href="../../favicon.ico?v=2" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="../../assets/img/favicon.svg?v=2" sizes="any">
<link rel="icon" type="image/png" sizes="48x48" href="../../assets/img/favicon-48.png?v=2">
<link rel="icon" type="image/png" sizes="192x192" href="../../assets/img/favicon-192.png?v=2">
<link rel="apple-touch-icon" href="../../assets/img/apple-touch-icon.png?v=2">
<link rel="canonical" href="{url}">
<link rel="alternate" type="application/rss+xml" title="Anand Kumar: blog" href="{site}feed.xml">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Anand Kumar">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{site}assets/img/og-image.png">
<meta property="article:published_time" content="{date}">
<meta property="article:author" content="Anand Kumar">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{site}assets/img/og-image.png">
<script type="application/ld+json">{jsonld}</script>
<!-- seo:end -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap">
<link rel="stylesheet" href="../../assets/css/styles.css">
</head>
<body>
<header class="nav">
  <div class="wrap">
    <a class="brand" href="../../">Anand Kumar</a>
    <nav class="links" aria-label="Primary">
      {nav}
    </nav>
    <a class="pill" href="../../contact/">Contact</a>
  </div>
</header>

<main class="wrap">
  <article class="post" id="post">
    <header class="post-head">
      <a class="back" href="../">← All posts</a>
      {tags}
      <h1>{title}</h1>
      <p class="meta">{when} · {minutes} min read · Anand Kumar</p>
    </header>
    <div class="prose" id="prose">
{body}
    </div>
    <nav class="post-nav" aria-label="More posts">
      {newer}
      {older}
    </nav>
  </article>

{foot}</main>
{mathjax}<script>
document.querySelectorAll('.codeblock button').forEach(function (b) {{
  b.addEventListener('click', function () {{
    var pre = b.closest('.codeblock').querySelector('pre');
    try {{ navigator.clipboard.writeText(pre.innerText).then(function () {{ b.textContent = 'Copied'; setTimeout(function () {{ b.textContent = 'Copy'; }}, 1600); }}); }} catch (e) {{}}
  }});
}});
</script>
<script src="../../assets/js/moon.js" defer></script>
</body>
</html>
"""

MATHJAX = ('<script>window.MathJax = { svg: { fontCache: \'local\' } };</script>\n'
           '<script async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js"></script>\n')


def main():
    names = json.loads((ROOT / "posts" / "index.json").read_text())
    posts = []
    for n in names:
        meta, body = parse(ROOT / "posts" / n)
        if str(meta.get("draft", "")).lower() == "true":
            continue
        slug = n[:-3] if n.endswith(".md") else n
        posts.append(dict(slug=slug, meta=meta, body=body))
    posts.sort(key=lambda p: p["meta"].get("date", ""), reverse=True)

    for i, p in enumerate(posts):
        m = p["meta"]; title = m.get("title", p["slug"])
        text, store = protect_math(p["body"])
        h = markdown.markdown(text, extensions=["tables", "fenced_code", "sane_lists"])
        h = fix_links(restore_math(h, store))
        words = len(text_of(h).split())
        summary = m.get("summary") or text_of(h)[:155]
        url = SITE + "blog/%s/" % p["slug"]
        tags = m.get("tags", [])
        tags = tags if isinstance(tags, list) else []
        card = lambda q, lab: ('<a class="post-card" href="../%s/"><span class="when">%s</span><h2>%s</h2></a>'
                               % (q["slug"], lab, html.escape(q["meta"].get("title", q["slug"])))) if q else "<span></span>"
        ld = {"@context": "https://schema.org", "@graph": [
            {"@type": "BlogPosting", "headline": title, "description": summary, "datePublished": m.get("date", ""),
             "dateModified": m.get("date", ""), "url": url, "mainEntityOfPage": url,
             "image": SITE + "assets/img/og-image.png", "keywords": ", ".join(tags),
             "author": {"@id": SITE + "#person"}, "publisher": {"@id": SITE + "#person"}},
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE},
                {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "blog/"},
                {"@type": "ListItem", "position": 3, "name": title, "item": url}]}]}
        page = TEMPLATE.format(
            title=html.escape(title), desc=html.escape(summary, quote=True), url=url, site=SITE, kw=html.escape(keywords(tags, title + ' ' + summary), quote=True),
            date=m.get("date", ""), jsonld=json.dumps(ld, ensure_ascii=False).replace("</", "<\\/"),
            nav=nav_links, tags=('<div class="tags">%s</div>' % "".join('<span class="tag">%s</span>' % html.escape(t) for t in tags)) if tags else "",
            when=fmt(m.get("date", "")), minutes=max(1, round(words / 200)), body=h,
            newer=card(posts[i - 1] if i > 0 else None, "Newer"),
            older=card(posts[i + 1] if i + 1 < len(posts) else None, "Older"),
            foot=FOOT, mathjax=MATHJAX if store else "")
        out = ROOT / "blog" / p["slug"]
        out.mkdir(parents=True, exist_ok=True)
        (out / "index.html").write_text(page, encoding="utf-8")
        p["url"], p["summary"], p["title"] = url, summary, title

    # RSS feed
    items = ""
    for p in posts:
        try:
            d = datetime.datetime.fromisoformat(p["meta"].get("date", "")).replace(tzinfo=datetime.timezone.utc)
            pub = d.strftime("%a, %d %b %Y %H:%M:%S +0000")
        except Exception:
            pub = ""
        items += ("  <item>\n    <title>%s</title>\n    <link>%s</link>\n    <guid isPermaLink=\"true\">%s</guid>\n"
                  "    <pubDate>%s</pubDate>\n    <description>%s</description>\n  </item>\n"
                  % (html.escape(p["title"]), p["url"], p["url"], pub, html.escape(p["summary"])))
    feed = ('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n'
            "  <title>Anand Kumar: blog</title>\n  <link>%sblog/</link>\n"
            "  <description>Write-ups on free-space optics, satellite QKD and the simulation work behind them.</description>\n"
            "  <language>en</language>\n  <atom:link href=\"%sfeed.xml\" rel=\"self\" type=\"application/rss+xml\"/>\n%s</channel>\n</rss>\n"
            % (SITE, SITE, items))
    (ROOT / "feed.xml").write_text(feed, encoding="utf-8")

    # no-JS fallback on the blog index: a plain list of links between markers
    import html as _h, re as _re  # _h: module (the name html is a local variable in main)
    bi = ROOT / "blog" / "index.html"
    items = "\n".join('<li><a href="%s/">%s</a> <span class="muted">%s</span></li>' % (
        p["slug"], _h.escape(p["meta"].get("title", p["slug"])), _h.escape(fmt(p["meta"].get("date", "")))) for p in posts)
    block = ('<!-- posts-noscript:start -->\n<noscript><style>.notice{display:none}</style>'
             '<section style="padding-top: 40px;"><h2>All posts</h2><ul class="plain">\n%s\n</ul></section></noscript>\n'
             '<!-- posts-noscript:end -->') % items
    page = bi.read_text()
    if "posts-noscript:start" in page:
        page = _re.sub(r"<!-- posts-noscript:start -->.*?<!-- posts-noscript:end -->", lambda m: block, page, flags=_re.S)
    else:
        page = page.replace('  <section style="padding-top: 40px;">\n    <div class="filters"', "  " + block + '\n\n  <section style="padding-top: 40px;">\n    <div class="filters"', 1)
    bi.write_text(page)

    # sitemap: replace post URLs
    sm = (ROOT / "sitemap.xml").read_text()
    sm = re.sub(r"  <url>\s*<loc>%sblog/[^<]+/</loc>.*?</url>\n" % re.escape(SITE), "", sm, flags=re.S)
    add = "".join("  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n    <priority>0.6</priority>\n  </url>\n"
                  % (p["url"], p["meta"].get("date", "")) for p in posts)
    sm = sm.replace("</urlset>", add + "</urlset>")
    (ROOT / "sitemap.xml").write_text(sm)
    print("built %d posts" % len(posts))


if __name__ == "__main__":
    main()
