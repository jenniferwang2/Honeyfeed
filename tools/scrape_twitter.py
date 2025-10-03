import json, pathlib
import snscrape.modules.twitter as sntwitter

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DATA.mkdir(exist_ok=True)

def slugify(s):
    import re
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", s.lower()))

def scrape(query, limit=50):
    out = []
    for i, t in enumerate(sntwitter.TwitterSearchScraper(query).get_items()):
        if i >= limit: break
        out.append({
            "content": t.content,
            "date": t.date.isoformat(),
            "username": getattr(t.user, "username", None),
            "url": f"https://twitter.com/{getattr(t.user, 'username', 'i')}/status/{t.id}",
        })
    return out

def main():
    queries = [q.strip() for q in (ROOT / "queries.txt").read_text().splitlines() if q.strip()]
    for q in queries:
        rows = scrape(q, limit=50)
        slug = slugify(q)
        path = DATA / f"tweets-{slug}.json"
        path.write_text(json.dumps(rows, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
