#!/usr/bin/env python3
"""Turn a pasted LinkedIn activity feed into posts/linkedin.json.

LinkedIn has no public feed for personal posts, so this works from text you
copy yourself: open your profile's "Posts" page, scroll down, select all, copy,
paste into a text file, then run

    python3 scripts/import_linkedin.py feed.txt

Reposts are skipped. Posts that already exist as full blog posts can be left
out by listing a phrase from them in SKIP below. Newest first, at most LIMIT.
"""
import json, re, sys, pathlib, unicodedata, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
LIMIT = 12
SKIP = ["Quantum Networks Under the Lens", "One thing I’ve slowly realized while exploring quantum communication"]
MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
DATE = re.compile(r"^(?:with .*?• )?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2})(?:, (\d{4}))?(?: • Edited)?\s*$", re.M)


def clean(text):
    text = unicodedata.normalize("NFKC", text)           # LinkedIn "bold" letters -> plain
    out = []
    for line in text.splitlines():
        s = line.rstrip()
        if re.fullmatch(r"\s*(View image|Feed post|… ?more|\d+)\s*", s):
            continue
        s = re.sub(r"\s*…\s*more\s*$", "", s)
        s = re.sub(r"(\s#\w+)+\s*$", "", s)               # trailing hashtags
        if re.fullmatch(r"\s*(#\w+\s*)+", s):
            continue
        out.append(s)
    t = "\n".join(out)
    return re.sub(r"\n{3,}", "\n\n", t).strip()


def excerpt(text, n=260):
    para = []
    for p in re.split(r"\n\s*\n", text):
        p = re.sub(r"\s+", " ", p).strip()
        if not p:
            continue
        para.append(p)
        if len(" ".join(para)) >= n * 0.6:
            break
    s = " ".join(para)
    if len(s) <= n:
        return s
    cut = s[:n]
    best = -1
    for mm in re.finditer(r"[.?!] ", cut):
        before = cut[:mm.start() + 1]
        if re.search(r"\b(Prof|Dr|Mr|Ms|Mrs|vs|etc|e\.g|i\.e)\.$", before):
            continue                                       # abbreviation, not a sentence end
        best = mm.start()
    return (cut[:best + 1] if best > n * 0.5 else cut.rsplit(" ", 1)[0] + "…")


def main(src):
    raw = pathlib.Path(src).read_text(encoding="utf-8")
    posts, now = [], datetime.date.today()
    for chunk in re.split(r"\n\s*Feed post\s*\n", raw):
        m = DATE.search(chunk)
        if not m or "reposted this" in chunk[:m.start()]:
            continue
        body = chunk[m.end():]
        if any(k in body for k in SKIP):
            continue
        mon, day = MONTHS.index(m.group(1)) + 1, int(m.group(2))
        year = int(m.group(3)) if m.group(3) else (now.year if datetime.date(now.year, mon, day) <= now else now.year - 1)
        text = clean(body)
        if len(text) < 40:
            continue
        posts.append({"date": datetime.date(year, mon, day).isoformat(), "text": excerpt(text)})
    posts.sort(key=lambda p: p["date"], reverse=True)
    (ROOT / "posts" / "linkedin.json").write_text(json.dumps(posts[:LIMIT], indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("wrote %d posts" % len(posts[:LIMIT]))


if __name__ == "__main__":
    main(sys.argv[1])
