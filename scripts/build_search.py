#!/usr/bin/env python3
"""Build assets/search-index.json for the site search.

Run from the repository root after changing any page or post:

    pip install beautifulsoup4
    python3 scripts/build_posts.py     # if posts changed
    python3 scripts/build_search.py

The index holds one entry per project, research item, publication, coursework
card and blog post: title, section, link and plain text. The search box
(assets/js/search.js) reads it in the browser, so nothing is sent anywhere.
"""
import json, re, pathlib
from bs4 import BeautifulSoup

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = [("research", "Research"), ("projects", "Projects"), ("publications", "Publications"), ("about", "About")]


def clean(t):
    return re.sub(r"\s+", " ", t or "").strip()


def page_entries(slug, label):
    soup = BeautifulSoup((ROOT / slug / "index.html").read_text(encoding="utf-8"), "html.parser")
    out = []
    main = soup.find("main") or soup
    for el in main.select("article, .card"):
        if el.find_parent("article") and el.name != "article":
            pass
        h = el.find(["h2", "h3"])
        if not h:
            continue
        title = clean(h.get_text(" "))
        text = clean(el.get_text(" "))
        if len(text) < 20:
            continue
        eid = el.get("id")
        if not eid:
            par = el.find_parent(["section", "article"])
            eid = par.get("id") if par is not None else None
        url = f"{slug}/" + (f"#{eid}" if eid else "")
        sec = el.find_parent("section")
        group = ""
        if sec is not None:
            sh = sec.select_one(".sec-head h2")
            if sh is not None and sh is not h:
                group = clean(sh.get_text(" "))
        out.append({"t": title, "s": label + (f" · {group}" if group and group != title else ""), "u": url, "x": text[:1400]})
    return out


def post_entries():
    out = []
    idx = json.loads((ROOT / "posts" / "index.json").read_text(encoding="utf-8"))
    for name in idx:
        raw = (ROOT / "posts" / name).read_text(encoding="utf-8")
        m = re.match(r"^---\s*\n(.*?)\n---\s*\n?", raw, re.S)
        meta, body = {}, raw
        if m:
            body = raw[m.end():]
            for line in m.group(1).splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    meta[k.strip()] = v.strip()
        if meta.get("draft", "").lower() == "true":
            continue
        body = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", body)
        body = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", body)
        body = re.sub(r"[`*_#>|$\\-]+", " ", body)
        slug = name[:-3]
        out.append({"t": meta.get("title", slug), "s": "Blog", "u": f"blog/{slug}/",
                    "x": clean(meta.get("summary", "") + " " + meta.get("tags", "") + " " + body)[:1800]})
    return out


def main():
    entries = []
    for slug, label in PAGES:
        entries += page_entries(slug, label)
    entries += post_entries()
    (ROOT / "assets" / "search-index.json").write_text(json.dumps(entries, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"indexed {len(entries)} entries")


if __name__ == "__main__":
    main()
