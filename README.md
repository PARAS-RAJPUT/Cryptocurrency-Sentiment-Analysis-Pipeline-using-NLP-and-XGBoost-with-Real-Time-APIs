# CryptoSentiment — Full-Stack NLP Pipeline

End-to-end crypto sentiment analysis: **Python XGBoost NLP → Flask API → Node/Express → MongoDB → React Dashboard**, all containerised with Docker.

```
[React/Nginx :80] → [Express :4000] → [Flask :5001]
                          ↓
                     [MongoDB :27017]
```

---

## Project Structure

```
crypto-sentiment-analysis/
├── frontend/                      React + Vite + Recharts
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── SentimentChart.jsx
│   │   │   ├── PredictionCard.jsx
│   │   │   └── MetricsCard.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Prediction.jsx
│   │   └── services/api.js
│   └── Dockerfile
│
├── backend/                       Node.js + Express + Mongoose
│   ├── controllers/
│   ├── routes/
│   ├── models/Sentiment.js
│   ├── middleware/errorHandler.js
│   ├── config/db.js
│   └── Dockerfile
│
├── ml-service/                    Python Flask + XGBoost
│   ├── data/                      CSV datasets
│   ├── src/
│   │   ├── preprocess.py          NLTK cleaning pipeline
│   │   ├── train.py               TF-IDF + XGBoost training
│   │   ├── predict.py             Inference module
│   │   ├── twitter_api.py         Tweepy wrapper
│   │   └── news_api.py            NewsAPI wrapper
│   ├── notebooks/analysis.ipynb
│   ├── api.py                     Flask REST service
│   └── Dockerfile
│
├── outputs/                       Auto-generated plots & reports
├── docker-compose.yml
├── .env
└── README.md
```

---

## Quick Start

```bash
# 1. Clone / unzip
# 2. Start everything
docker compose up --build
```

Open **http://localhost** — done.

> First boot takes ~90s — the ML container trains XGBoost automatically.  
> Subsequent starts are instant (model cached in `cryptosentiment-models` volume).

---

## Services

| Service    | Stack              | Port (internal) | Public |
|------------|--------------------|-----------------|--------|
| `ml`       | Python 3.11 / Flask| 5001            | ❌     |
| `mongo`    | MongoDB 7          | 27017           | ❌     |
| `backend`  | Node 20 / Express  | 4000            | ❌     |
| `frontend` | Nginx / React      | 80              | ✅ 80  |

Only port **80** is exposed. All inter-service traffic runs on the internal `cryptosentiment-net` bridge.

---

## API Reference

All routes accessible from the browser via `/api/...`

### Sentiment
| Method | Path                        | Description                        |
|--------|-----------------------------|------------------------------------|
| POST   | /api/sentiment/predict      | `{text}` → sentiment + confidence  |
| POST   | /api/sentiment/predict/batch| `{texts[]}` → batch results        |
| GET    | /api/sentiment/history      | Saved predictions (MongoDB)        |
| GET    | /api/sentiment/stats        | Aggregated DB statistics           |
| GET    | /api/sentiment/metrics      | Model accuracy, F1, CV scores      |
| GET    | /api/sentiment/dataset/stats| Training data distribution         |
| POST   | /api/sentiment/retrain      | Re-train model with current data   |

### Feeds
| Method | Path                | Params                 |
|--------|---------------------|------------------------|
| GET    | /api/feed/twitter   | coin, limit, sample    |
| GET    | /api/feed/news      | topic, limit, sample   |

---

## Adding Real API Keys

Edit `.env`:
```env
TWITTER_BEARER_TOKEN=your_token_here
NEWS_API_KEY=your_key_here
```
Then restart: `docker compose up -d backend ml`

When keys are absent the app automatically falls back to the bundled sample CSVs.

---

## Swap In Your Own Dataset

Edit `ml-service/src/train.py` → `load_data()`:
```python
import pandas as pd
def load_data():
    df = pd.read_csv("/app/data/my_dataset.csv")
    return df[["text","label"]]
```

Then force retrain:
```bash
docker volume rm cryptosentiment-models
docker compose up --build ml
```

---

## Useful Commands

```bash
# Start in background
docker compose up -d --build

# Tail all logs
docker compose logs -f

# Logs for one service
docker compose logs -f ml

# Shell into ML container
docker exec -it crypto-ml bash

# Stop everything
docker compose down

# Full reset (wipes DB + model)
docker compose down -v
```

---

## Tech Stack

| Layer        | Tech                              |
|--------------|-----------------------------------|
| ML model     | XGBoost + scikit-learn TF-IDF     |
| NLP          | NLTK (tokenise, stopwords, lemma) |
| ML API       | Python Flask + flask-cors         |
| Backend      | Node.js + Express + Mongoose      |
| Database     | MongoDB 7                         |
| Frontend     | React 18 + Vite + Recharts        |
| Web server   | Nginx (SPA + API proxy)           |
| Containers   | Docker + Docker Compose v3.9      |
| Data sources | Mendeley CSV, Twitter API, NewsAPI|
