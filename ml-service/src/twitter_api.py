"""
twitter_api.py
Tweepy v4 wrapper. Falls back to twitter_sample.csv when no bearer token is set.
"""

import os, csv, logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

try:
    import tweepy
    _TWEEPY = True
except ImportError:
    _TWEEPY = False

BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN", "")
_SAMPLE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            "data", "twitter_sample.csv")

_QUERIES = {
    "bitcoin":  "#Bitcoin OR $BTC OR bitcoin",
    "ethereum": "#Ethereum OR $ETH OR ethereum",
    "solana":   "#Solana OR $SOL OR solana",
    "crypto":   "#crypto OR cryptocurrency OR blockchain",
}


def _load_sample(n: int) -> List[Dict]:
    if not os.path.exists(_SAMPLE_PATH):
        return []
    rows = []
    with open(_SAMPLE_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append({
                "id": row.get("id",""), "text": row.get("text",""),
                "created_at": row.get("date",""), "likes": 0,
                "retweets": 0, "source": "sample",
            })
    return rows[:n]


def get_tweets(coin: str = "bitcoin", max_results: int = 30,
               use_sample: bool = False) -> List[Dict]:
    if use_sample or not BEARER_TOKEN or not _TWEEPY:
        return _load_sample(max_results)
    try:
        client = tweepy.Client(bearer_token=BEARER_TOKEN, wait_on_rate_limit=True)
        q      = f"({_QUERIES.get(coin.lower(), coin)}) lang:en -is:retweet"
        resp   = client.search_recent_tweets(
            query=q, max_results=min(max_results, 100),
            tweet_fields=["created_at","public_metrics"],
        )
        if not resp.data:
            return []
        return [
            {
                "id": str(t.id), "text": t.text,
                "created_at": t.created_at.isoformat() if t.created_at else "",
                "likes":    (t.public_metrics or {}).get("like_count",    0),
                "retweets": (t.public_metrics or {}).get("retweet_count", 0),
                "source":   "twitter_api",
            }
            for t in resp.data
        ]
    except Exception as e:
        logger.warning(f"Twitter API error: {e} — using sample")
        return _load_sample(max_results)


if __name__ == "__main__":
    tweets = get_tweets(use_sample=True)
    print(f"Loaded {len(tweets)} tweets")
    for t in tweets[:3]:
        print(f"  {t['text'][:80]}")
