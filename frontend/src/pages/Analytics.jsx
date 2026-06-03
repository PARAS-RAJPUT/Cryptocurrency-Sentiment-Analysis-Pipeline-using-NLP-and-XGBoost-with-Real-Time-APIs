import { useState, useEffect } from "react";
import { getModelMetrics, getDatasetStats, getNewsFeed, getTwitterFeed } from "../services/api";
import { SentimentDonut, SentimentBar } from "../components/SentimentChart";
import MetricsCard from "../components/MetricsCard";
import styles from "./Analytics.module.css";

const TABS = ["model", "dataset", "feeds"];

export default function Analytics() {
  const [metrics, setMetrics] = useState(null);
  const [stats,   setStats]   = useState(null);
  const [tab,     setTab]     = useState("model");
  const [feed,    setFeed]    = useState(null);
  const [feedLoad,setFeedLoad]= useState(false);

  useEffect(() => {
    Promise.allSettled([getModelMetrics(), getDatasetStats()]).then(([m, s]) => {
      if (m.status === "fulfilled") setMetrics(m.value.data);
      if (s.status === "fulfilled") setStats(s.value.data);
    });
  }, []);

  async function loadFeed(type) {
    setFeedLoad(true);
    try {
      const fn = type === "twitter" ? getTwitterFeed : getNewsFeed;
      const { data } = await fn({ limit: 20 });
      setFeed({ ...data, type });
    } finally { setFeedLoad(false); }
  }

  const cr          = metrics?.classification_report || {};
  const classLabels = ["positive", "negative", "neutral"];

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Analytics</h1>
        <p className={styles.sub}>Model performance, dataset insights, and live feed breakdown</p>
      </div>

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`${styles.tab} ${tab===t ? styles.active : ""}`}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Model tab ── */}
      {tab === "model" && (
        <div className="fade-up">
          <div className={styles.kpiRow}>
            <MetricsCard title="Accuracy"
              value={metrics ? `${Math.round((metrics.accuracy||0)*100)}%` : "—"}
              color="var(--pos)" icon="🎯" />
            <MetricsCard title="CV Accuracy"
              value={metrics ? `${Math.round((metrics.cv_accuracy_mean||0)*100)}%` : "—"}
              sub={metrics ? `±${Math.round((metrics.cv_accuracy_std||0)*100)}%` : ""}
              color="var(--neu)" icon="📐" />
            <MetricsCard title="TF-IDF features"
              value={metrics?.n_features ?? "—"} icon="🔢" />
            <MetricsCard title="Training samples"
              value={metrics?.n_samples ?? "—"} icon="📊" />
          </div>

          {classLabels.some(l => cr[l]) && (
            <div className="card" style={{ marginTop:20 }}>
              <p className="label" style={{ marginBottom:16 }}>Per-class metrics</p>
              <div style={{ overflowX:"auto" }}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1-Score</th><th>Support</th></tr>
                  </thead>
                  <tbody>
                    {classLabels.map(lbl => cr[lbl] && (
                      <tr key={lbl}>
                        <td>
                          <span className={`badge badge-${lbl==="positive"?"pos":lbl==="negative"?"neg":"neu"}`}>
                            {lbl}
                          </span>
                        </td>
                        <td>{Math.round((cr[lbl].precision||0)*100)}%</td>
                        <td>{Math.round((cr[lbl].recall||0)*100)}%</td>
                        <td>{Math.round((cr[lbl]["f1-score"]||0)*100)}%</td>
                        <td>{cr[lbl].support}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Dataset tab ── */}
      {tab === "dataset" && (
        <div className="fade-up">
          <div className={styles.twoCol}>
            <div className="card">
              <p className="label">Label distribution</p>
              <SentimentDonut data={stats?.distribution || {}} />
            </div>
            <div className="card">
              <p className="label">Samples per source</p>
              <SentimentBar
                data={Object.entries(stats?.distribution||{}).map(([name,value])=>({name,value}))} />
            </div>
          </div>
          <div className={styles.statRow} style={{ marginTop:16 }}>
            {Object.entries(stats?.distribution||{}).map(([key,val]) => (
              <MetricsCard key={key} title={`${key} samples`} value={val}
                sub={stats?.total ? `${Math.round(val/stats.total*100)}% of total` : ""}
                color={key==="positive"?"var(--pos)":key==="negative"?"var(--neg)":"var(--neu)"} />
            ))}
          </div>
        </div>
      )}

      {/* ── Feeds tab ── */}
      {tab === "feeds" && (
        <div className="fade-up">
          <div className={styles.feedBtns}>
            <button className="btn-ghost" onClick={() => loadFeed("twitter")}>🐦 Load Twitter</button>
            <button className="btn-ghost" onClick={() => loadFeed("news")}>📰 Load News</button>
          </div>
          {feedLoad && (
            <p className="pulsing" style={{ color:"var(--muted)", padding:40, textAlign:"center" }}>
              Fetching feed…
            </p>
          )}
          {feed && !feedLoad && (
            <div className={styles.twoCol} style={{ marginTop:20 }}>
              <div className="card">
                <p className="label">{feed.type} distribution</p>
                <SentimentDonut data={feed.summary||{}} />
              </div>
              <div className="card">
                <p className="label">{feed.total} results</p>
                <div className={styles.feedScroll}>
                  {(feed.results||[]).slice(0,12).map((r,i) => {
                    const cls = r.sentiment==="positive"?"pos":r.sentiment==="negative"?"neg":"neu";
                    return (
                      <div key={i} className={styles.feedRow}>
                        <span className={`badge badge-${cls}`}>{r.sentiment}</span>
                        <span className={styles.feedText}>
                          {(r.meta?.title||r.text)?.slice(0,88)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
