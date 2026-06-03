"""
predict.py
Loads saved artifacts and exposes predict_one / predict_batch / get_summary.
"""

import os, sys, pickle
sys.path.insert(0, os.path.dirname(__file__))
from preprocess import clean_text, clean_batch

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")

_model = _vec = _le = None


def _load():
    global _model, _vec, _le
    paths = {k: os.path.join(MODEL_DIR, f"{k}.pkl")
             for k in ["model","vectorizer","label_encoder"]}
    missing = [k for k,v in paths.items() if not os.path.exists(v)]
    if missing:
        raise FileNotFoundError(f"Missing artifacts: {missing}. Run train.py first.")
    with open(paths["model"],         "rb") as f: _model = pickle.load(f)
    with open(paths["vectorizer"],    "rb") as f: _vec   = pickle.load(f)
    with open(paths["label_encoder"], "rb") as f: _le    = pickle.load(f)


def _ensure():
    if _model is None:
        _load()


def predict_one(text: str) -> dict:
    _ensure()
    vec   = _vec.transform([clean_text(text)])
    pred  = _model.predict(vec)[0]
    proba = _model.predict_proba(vec)[0]
    label = _le.inverse_transform([pred])[0]
    cls   = _le.classes_.tolist()
    return {
        "text":       text,
        "sentiment":  label,
        "score":      round(float(max(proba)), 4),
        "confidence": {c: round(float(p), 4) for c, p in zip(cls, proba)},
    }


def predict_batch(texts: list) -> list:
    _ensure()
    cleaned = clean_batch(texts)
    vecs    = _vec.transform(cleaned)
    preds   = _model.predict(vecs)
    probas  = _model.predict_proba(vecs)
    labels  = _le.inverse_transform(preds)
    cls     = _le.classes_.tolist()
    return [
        {
            "text":       t[:200],
            "sentiment":  lbl,
            "score":      round(float(max(pr)), 4),
            "confidence": {c: round(float(p), 4) for c, p in zip(cls, pr)},
        }
        for t, lbl, pr in zip(texts, labels, probas)
    ]


def get_summary(results: list) -> dict:
    counts = {"positive": 0, "negative": 0, "neutral": 0}
    for r in results:
        counts[r["sentiment"]] = counts.get(r["sentiment"], 0) + 1
    total = len(results)
    return {
        "counts":      counts,
        "percentages": {k: round(v/total*100, 1) if total else 0 for k, v in counts.items()},
        "total":       total,
        "avg_confidence": round(sum(r["score"] for r in results)/total, 4) if total else 0,
    }


if __name__ == "__main__":
    for s in [
        "Bitcoin just hit a new all-time high! Incredible bull run!",
        "Lost everything in the crash. This market is a disaster.",
        "BTC price stable today. No major moves expected.",
    ]:
        r = predict_one(s)
        print(f"{r['sentiment'].upper():8} {r['score']:.2f}  {s[:60]}")
