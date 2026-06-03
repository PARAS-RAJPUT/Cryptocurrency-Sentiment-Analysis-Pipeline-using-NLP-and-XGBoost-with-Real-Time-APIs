import { useState, useEffect } from "react";
import { getDatasetStats, getModelMetrics, getNewsFeed, getTwitterFeed } from "../services/api";
import MetricsCard from "../components/MetricsCard";
import { SentimentDonut, SentimentBar } from "../components/SentimentChart";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const [stats,   setStats]   = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [news,    setNews]    = useState(null);
  const [tweets,  setTweets]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    Promise.allSettled([
      getDatasetStats(),
      getModelMetrics(),
      getNewsFeed({ limit: 12 }),
      getTwitterFeed({ limit: 12 }),
    ]).then(([s, m, n, t]) => {
      if (s.status === "fulfilled") setStats(s.value.data);
      if (m.status === "fulfilled") setMetrics(m.value.data);
      if (n.status === "fulfilled") setNews(n.value.data);
      if (t.status === "fulfilled") setTweets(t.value.data);
      if ([s,m,n,t].every(r => r.status === "rejected"))
        setError("Cannot reach backend — make sure all services are running.");
      setLoading(false);
    });
  }, []);

  const newsBar   = Object.entries(news?.summary   || {}).map(([name,value])=>({name,value}));
  const tweetBar  = Object.entries(tweets?.summary || {}).map(([name,value])=>({name,value}));

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.sub}>Live crypto sentiment powered by XGBoost NLP</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* KPI row */}
      <div className={styles.kpiRow}>
        <MetricsCard title="Training samples" value={loading ? "…" : stats?.total}
          sub="across all datasets" icon="📊" />
        <MetricsCard title="Model accuracy"
          value={loading ? "…" : metrics?.accuracy ? `${Math.round(metrics.accuracy*100)}%` : "—"}
          sub={metrics ? `CV: ${Math.round((metrics.cv_accuracy_mean||0)*100)}%` : "train model first"}
          color="var(--pos)" icon="🎯" />
        <MetricsCard title="News articles"   value={loading ? "…" : news?.total}
          sub="latest sample feed" color="var(--gold)" icon="📰" />
        <MetricsCard title="Tweets analysed" value={loading ? "…" : tweets?.total}
          sub="latest sample feed" color="var(--neu)"  icon="🐦" />
      </div>

      {/* Charts */}
      <div className={styles.charts}>
        <div className="card">
          <p className="label">Dataset distribution</p>
          <SentimentDonut data={stats?.distribution || {}} />
        </div>
        <div className="card">
          <p className="label">News sentiment</p>
          <SentimentBar data={newsBar} />
        </div>
        <div className="card">
          <p className="label">Twitter sentiment</p>
          <SentimentBar data={tweetBar} />
        </div>
      </div>

      {/* Feed table */}
      {news?.results?.length > 0 && (
        <div className="card" style={{ marginTop:24 }}>
          <p className="label" style={{ marginBottom:16 }}>Latest news feed</p>
          <div className={styles.feedList}>
            {news.results.slice(0,10).map((r,i) => {
              const cls = r.sentiment==="positive"?"pos":r.sentiment==="negative"?"neg":"neu";
              return (
                <div key={i} className={styles.feedRow}>
                  <span className={`badge badge-${cls}`}>{r.sentiment}</span>
                  <span className={styles.feedText}>{r.meta?.title || r.text?.slice(0,100)}</span>
                  <span className={styles.feedScore}>{Math.round(r.score*100)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
