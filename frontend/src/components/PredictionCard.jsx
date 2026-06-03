import styles from "./PredictionCard.module.css";

const META = {
  positive: { emoji:"😊", color:"var(--pos)", dim:"var(--pos-dim)", label:"Positive" },
  negative: { emoji:"😞", color:"var(--neg)", dim:"var(--neg-dim)", label:"Negative" },
  neutral:  { emoji:"😐", color:"var(--neu)", dim:"var(--neu-dim)", label:"Neutral"  },
};

export default function PredictionCard({ result }) {
  if (!result) return null;
  const m   = META[result.sentiment] || META.neutral;
  const cls = result.sentiment === "positive" ? "pos"
            : result.sentiment === "negative" ? "neg" : "neu";

  return (
    <div className={styles.card + " card fade-up"} style={{ borderColor: m.color + "44" }}>
      <div className={styles.header}>
        <div className={styles.left}>
          <span className={`badge badge-${cls}`} style={{ fontSize:13, padding:"5px 14px" }}>
            {m.emoji}&nbsp;{m.label}
          </span>
          <p className={styles.text}>"{result.text?.slice(0,200)}"</p>
        </div>
        <div className={styles.score} style={{ background:m.dim, color:m.color }}>
          <span className={styles.scoreNum}>{Math.round((result.score||0)*100)}</span>
          <span className={styles.scoreSub}>/ 100</span>
          <span className={styles.scoreTag}>
            {result.score >= .8 ? "High" : result.score >= .6 ? "Med" : "Low"}
          </span>
        </div>
      </div>

      {result.confidence && (
        <>
          <hr className="divider" />
          <p className="label">Confidence breakdown</p>
          <div className={styles.bars}>
            {Object.entries(result.confidence)
              .sort((a,b) => b[1]-a[1])
              .map(([key, val]) => {
                const km = META[key] || META.neutral;
                return (
                  <div key={key} className={styles.barRow}>
                    <span className={styles.barLabel}>{km.label}</span>
                    <div className={styles.track}>
                      <div className={styles.fill}
                        style={{ width:`${val*100}%`, background:km.color }} />
                    </div>
                    <span className={styles.pct}>{Math.round(val*100)}%</span>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
