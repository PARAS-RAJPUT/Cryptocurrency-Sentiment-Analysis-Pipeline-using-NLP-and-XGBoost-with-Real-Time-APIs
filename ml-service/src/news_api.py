"""
news_api.py
NewsAPI.org wrapper. Falls back to news_sample.csv when no API key is set.
"""

import os, csv, logging, requests
from datetime import datetime, timedelta
from typing import List, Dict

logger = logging.getLogger(__name__)

NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
_BASE_URL    = "https://newsapi.org/v2/everything"
_SAMPLE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            "data", "news_sample.csv")

_QUERIES = {
    "bitcoin":  "bitcoin OR BTC",
    "ethereum": "ethereum OR ETH",
    "solana":   "solana OR SOL",
    "crypto":   "cryptocurrency OR blockchain OR crypto",
    "defi":     "DeFi OR decentralized finance",
    "nft":      "NFT OR non-fungible token",
}


def _load_sample(n: int) -> List[Dict]:
    if not os.path.exists(_SAMPLE_PATH):
        return []
    rows = []
    with open(_SAMPLE_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            title = row.get("title","")
            desc  = row.get("description","")
            rows.append({
                "id": row.get("id",""), "title": title,
                "description": desc,
                "text": f"{title} {desc}".strip(),
                "source": row.get("source","sample"),
                "published_at": row.get("date",""),
                "url": "",
            })
    return rows[:n]


def get_news(topic: str = "crypto", days_back: int = 7,
             page_size: int = 20, use_sample: bool = False) -> List[Dict]:
    if use_sample or not NEWS_API_KEY:
        return _load_sample(page_size)
    try:
        params = {
            "q":        _QUERIES.get(topic.lower(), topic),
            "language": "en",
            "from":     (datetime.utcnow() - timedelta(days=days_back)).strftime("%Y-%m-%d"),
            "sortBy":   "publishedAt",
            "pageSize": min(page_size, 100),
            "apiKey":   NEWS_API_KEY,
        }
        resp = requests.get(_BASE_URL, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if data.get("status") != "ok":
            raise RuntimeError(data.get("message","Unknown error"))
        return [
            {
                "id":           a.get("url",""),
                "title":        a.get("title","") or "",
                "description":  a.get("description","") or "",
                "text":         f"{a.get('title','')} {a.get('description','')}".strip(),
                "source":       (a.get("source") or {}).get("name",""),
                "published_at": a.get("publishedAt",""),
                "url":          a.get("url",""),
            }
            for a in data.get("articles",[]) if a.get("title")
        ]
    except Exception as e:
        logger.warning(f"NewsAPI error: {e} — using sample")
        return _load_sample(page_size)


if __name__ == "__main__":
    articles = get_news(use_sample=True)
    print(f"Loaded {len(articles)} articles")
    for a in articles[:3]:
        print(f"  [{a['source']}] {a['title'][:70]}")
