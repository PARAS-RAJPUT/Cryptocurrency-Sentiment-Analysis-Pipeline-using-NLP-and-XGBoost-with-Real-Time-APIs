"""
api.py — Flask REST service
Auto-trains on first start if model artifacts are absent.
"""

import os, sys, json, logging
from flask import Flask, request, jsonify
from flask_cors import CORS

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "src"))
from predict     import predict_one, predict_batch, get_summary
from train       import load_data, train
from twitter_api import get_tweets
from news_api    import get_news

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")

app = Flask(__name__)
CORS(app)

MODEL_DIR   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
REPORTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "outputs", "reports")


def boot():
    os.makedirs(MODEL_DIR,   exist_ok=True)
    os.makedirs(REPORTS_DIR, exist_ok=True)
    needed = ["model.pkl","vectorizer.pkl","label_encoder.pkl"]
    if all(os.path.exists(os.path.join(MODEL_DIR, f)) for f in needed):
        logging.info("Model artifacts found — ready.")
    else:
        logging.info("No artifacts — training now …")
        train(load_data())
        logging.info("Training complete.")


# ─────────────────────────────────────────────────────────────

@app.route("/health")
def health():
    ready = all(os.path.exists(os.path.join(MODEL_DIR, f))
                for f in ["model.pkl","vectorizer.pkl","label_encoder.pkl"])
    return jsonify({"status": "ok", "model_ready": ready})


@app.route("/predict", methods=["POST"])
def predict():
    body = request.get_json(silent=True) or {}
    text = body.get("text","").strip()
    if not text:
        return jsonify({"error": "text required"}), 400
    try:
        return jsonify(predict_one(text))
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503


@app.route("/predict/batch", methods=["POST"])
def batch():
    body  = request.get_json(silent=True) or {}
    texts = body.get("texts", [])[:100]
    if not texts:
        return jsonify({"error": "texts array required"}), 400
    try:
        results = predict_batch(texts)
        return jsonify({"results": results, "summary": get_summary(results), "total": len(results)})
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503


@app.route("/feed/twitter")
def feed_twitter():
    coin    = request.args.get("coin",   "bitcoin")
    limit   = int(request.args.get("limit", 20))
    sample  = request.args.get("sample","true").lower() != "false"
    tweets  = get_tweets(coin=coin, max_results=limit, use_sample=sample)
    if not tweets:
        return jsonify({"results":[], "summary":{}, "total":0})
    try:
        results = predict_batch([t["text"] for t in tweets])
        for i, r in enumerate(results):
            r["meta"] = {k: tweets[i].get(k) for k in ["created_at","likes","retweets","source"]}
        return jsonify({"results": results, "summary": get_summary(results), "total": len(results)})
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503


@app.route("/feed/news")
def feed_news():
    topic   = request.args.get("topic",  "crypto")
    limit   = int(request.args.get("limit", 20))
    sample  = request.args.get("sample","true").lower() != "false"
    articles = get_news(topic=topic, page_size=limit, use_sample=sample)
    if not articles:
        return jsonify({"results":[], "summary":{}, "total":0})
    try:
        results = predict_batch([a["text"] for a in articles])
        for i, r in enumerate(results):
            r["meta"] = {k: articles[i].get(k) for k in ["title","source","published_at","url"]}
        return jsonify({"results": results, "summary": get_summary(results), "total": len(results)})
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503


@app.route("/dataset/stats")
def dataset_stats():
    df = load_data()
    return jsonify({
        "total":        len(df),
        "distribution": df["label"].value_counts().to_dict(),
    })


@app.route("/metrics")
def metrics():
    path = os.path.join(REPORTS_DIR, "model_metrics.json")
    if not os.path.exists(path):
        return jsonify({"error": "No metrics yet. Train first."}), 404
    with open(path) as f:
        return jsonify(json.load(f))


@app.route("/retrain", methods=["POST"])
def retrain():
    try:
        info = train(load_data())
        return jsonify({"message": "Retrain complete", "accuracy": info["metrics"]["accuracy"]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    boot()
    app.run(host="0.0.0.0", port=5001, debug=False)
