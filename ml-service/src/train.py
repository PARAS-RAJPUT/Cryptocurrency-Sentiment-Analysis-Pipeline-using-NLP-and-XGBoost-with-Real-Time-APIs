"""
train.py
XGBoost + TF-IDF training pipeline. Saves model.pkl, vectorizer.pkl, label_encoder.pkl.
"""

import os, sys, json, pickle
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing           import LabelEncoder
from sklearn.model_selection         import train_test_split, cross_val_score
from sklearn.metrics                 import classification_report, accuracy_score
from xgboost import XGBClassifier

sys.path.insert(0, os.path.dirname(__file__))
from preprocess import clean_batch

BASE        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR    = os.path.join(BASE, "data")
MODEL_DIR   = os.path.join(BASE, "models")
REPORTS_DIR = os.path.join(BASE, "..", "outputs", "reports")

for d in [MODEL_DIR, REPORTS_DIR]:
    os.makedirs(d, exist_ok=True)


def load_data() -> pd.DataFrame:
    dfs = []
    files = {
        "crypto_news_mendeley.csv": None,
        "twitter_sample.csv":       None,
        "news_sample.csv":          ["title", "description"],
    }
    for fname, text_cols in files.items():
        path = os.path.join(DATA_DIR, fname)
        if not os.path.exists(path):
            print(f"  [skip] {fname} not found")
            continue
        df = pd.read_csv(path)
        if text_cols:
            df["text"] = df[text_cols[0]].fillna("") + " " + df[text_cols[1]].fillna("")
        df = df[["text", "label"]].dropna()
        dfs.append(df)
        print(f"  {len(df):>3} rows ← {fname}")

    combined = pd.concat(dfs, ignore_index=True)
    combined["label"] = combined["label"].str.lower().str.strip()
    combined = combined[combined["label"].isin(["positive","negative","neutral"])]
    print(f"  Total: {len(combined)} | {combined['label'].value_counts().to_dict()}")
    return combined


def train(df: pd.DataFrame) -> dict:
    print("\n[1/4] Encoding labels …")
    le = LabelEncoder()
    y  = le.fit_transform(df["label"])

    print("[2/4] Cleaning & vectorising …")
    cleaned = clean_batch(df["text"].tolist())
    vec = TfidfVectorizer(max_features=8000, ngram_range=(1,3), sublinear_tf=True, min_df=1)
    X   = vec.fit_transform(cleaned)

    print("[3/4] Train/test split …")
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("[4/4] Training XGBoost …")
    clf = XGBClassifier(
        n_estimators=200, max_depth=5, learning_rate=0.1,
        subsample=0.8, colsample_bytree=0.8,
        use_label_encoder=False, eval_metric="mlogloss",
        random_state=42, n_jobs=-1,
    )
    clf.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)

    y_pred   = clf.predict(X_te)
    acc      = accuracy_score(y_te, y_pred)
    report   = classification_report(y_te, y_pred, target_names=le.classes_, output_dict=True)
    cv       = cross_val_score(clf, X, y, cv=5, scoring="accuracy")

    print(f"\n  Accuracy : {acc:.4f}")
    print(f"  CV       : {cv.mean():.4f} ± {cv.std():.4f}")
    print(classification_report(y_te, y_pred, target_names=le.classes_))

    # save artifacts
    for name, obj in [("model.pkl", clf), ("vectorizer.pkl", vec), ("label_encoder.pkl", le)]:
        with open(os.path.join(MODEL_DIR, name), "wb") as f:
            pickle.dump(obj, f)

    metrics = {
        "accuracy": round(acc, 4),
        "cv_accuracy_mean": round(float(cv.mean()), 4),
        "cv_accuracy_std":  round(float(cv.std()),  4),
        "classification_report": report,
        "confusion_matrix": clf.predict(X_te).tolist(),
        "classes": le.classes_.tolist(),
        "n_samples": len(df),
        "n_features": X.shape[1],
    }
    with open(os.path.join(REPORTS_DIR, "model_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\n  Artifacts → {MODEL_DIR}")
    return {"clf": clf, "vectorizer": vec, "label_encoder": le, "metrics": metrics}


if __name__ == "__main__":
    print("=== Crypto Sentiment Training ===\n")
    train(load_data())
    print("\nDone.")
