import { useState } from "react";
import { predictText, predictBatch } from "../services/api";
import PredictionCard from "../components/PredictionCard";
import { SentimentDonut } from "../components/SentimentChart";
import styles from "./Prediction.module.css";

const EXAMPLES = [
  "Bitcoin just hit a new all-time high! Incredible bull run and institutional adoption soaring.",
  "Crypto exchange collapsed overnight, losing millions in user funds. Total disaster.",
  "BTC trading volume remains consistent today. Market holding steady at current levels.",
  "DeFi yields are looking extremely attractive right now, staking rewards are impressive!",
  "Another rug pull in the NFT space. Investors losing confidence in the entire ecosystem.",
];

export default function Prediction() {
  const [text,      setText]      = useState("");
  const [result,    setResult]    = useState(null);
  const [batchText, setBatchText] = useState("");
  const [batchRes,  setBatchRes]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [batchLoad, setBatchLoad] = useState(false);
  const [error,     setError]     = useState("");
  const [tab,       setTab]       = useState("single");

  async function handlePredict() {
    if (!text.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const { data } = await predictText(text.trim());
      setResult(data);
    } catch { setError("Could not reach ML service. Make sure all containers are running."); }
    finally   { setLoading(false); }
  }

  async function handleBatch() {
    const lines = batchText.split("\n").map(l=>l.trim()).filter(Boolean);
    if (!lines.length) return;
    setBatchLoad(true); setError("");
    try {
      const { data } = await predictBatch(lines);
      setBatchRes(data);
    } catch { setError("Could not reach ML service."); }
    finally   { setBatchLoad(false); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Sentiment Prediction</h1>
        <p className={styles.sub}>Analyse crypto tweets, news headlines, or any text with XGBoost NLP</p>
      </div>

      <div className={styles.tabs}>
        {["single","batch"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`${styles.tab} ${tab===t ? styles.active : ""}`}>
            {t === "single" ? "Single text" : "Batch analysis"}
          </button>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* ── Single ── */}
      {tab === "single" && (
        <div className="fade-up">
          <div className="card">
            <textarea
              className={styles.textarea} rows={5} value={text}
              placeholder="Enter a crypto tweet, news headline, or any text…"
              onChange={e => { setText(e.target.value); setResult(null); }}
              onKeyDown={e => { if (e.key==="Enter" && e.metaKey) handlePredict(); }}
            />
            <div className={styles.foot}>
              <span className={styles.chars}>{text.length} chars</span>
              <button className="btn-primary" onClick={handlePredict}
                disabled={loading || !text.trim()}>
                {loading ? <span className="pulsing">Analysing…</span> : "Predict →"}
              </button>
            </div>
          </div>

          <div className={styles.examples}>
            <span className={styles.exLabel}>Try:</span>
            {EXAMPLES.map(ex => (
              <button key={ex} className={styles.exBtn}
                onClick={() => { setText(ex); setResult(null); }}>
                {ex.slice(0,55)}…
              </button>
            ))}
          </div>

          {result && <PredictionCard result={result} />}
        </div>
      )}

      {/* ── Batch ── */}
      {tab === "batch" && (
        <div className="fade-up">
          <div className={styles.batchGrid}>
            <div className="card">
              <textarea
                className={styles.textarea} rows={14} value={batchText}
                placeholder={"One text per line…\n\nBitcoin is surging!\nCrypto crashed again.\nMarket looks flat today."}
                onChange={e => { setBatchText(e.target.value); setBatchRes(null); }}
              />
              <div className={styles.foot}>
                <span className={styles.chars}>
                  {batchText.split("\n").filter(l=>l.trim()).length} lines
                </span>
                <button className="btn-primary" onClick={handleBatch}
                  disabled={batchLoad || !batchText.trim()}>
                  {batchLoad ? <span className="pulsing">Analysing…</span> : "Analyse all →"}
                </button>
              </div>
            </div>

            {batchRes && (
              <div className={styles.batchRight}>
                <div className="card">
                  <p className="label">Distribution</p>
                  <SentimentDonut data={batchRes.summary||{}} />
                </div>
                <div className={styles.batchStats}>
                  {Object.entries(batchRes.summary||{}).map(([k,v]) => {
                    const col = k==="positive"?"var(--pos)":k==="negative"?"var(--neg)":"var(--neu)";
                    return (
                      <div key={k} className="card-sm" style={{ textAlign:"center" }}>
                        <p style={{ fontFamily:"var(--font-head)", fontSize:28, fontWeight:800, color:col }}>{v}</p>
                        <p style={{ fontSize:11, color:"var(--muted)", marginTop:4, textTransform:"uppercase", letterSpacing:".05em" }}>{k}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {batchRes?.results && (
            <div className="card" style={{ marginTop:20 }}>
              <p className="label" style={{ marginBottom:14 }}>
                Results ({batchRes.total})
              </p>
              <div style={{ overflowX:"auto" }}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>#</th><th>Text</th><th>Sentiment</th><th>Confidence</th></tr>
                  </thead>
                  <tbody>
                    {batchRes.results.map((r,i) => {
                      const cls = r.sentiment==="positive"?"pos":r.sentiment==="negative"?"neg":"neu";
                      return (
                        <tr key={i}>
                          <td className={styles.idx}>{i+1}</td>
                          <td className={styles.tdText}>{r.text}</td>
                          <td><span className={`badge badge-${cls}`}>{r.sentiment}</span></td>
                          <td className={styles.tdScore}>{Math.round(r.score*100)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
