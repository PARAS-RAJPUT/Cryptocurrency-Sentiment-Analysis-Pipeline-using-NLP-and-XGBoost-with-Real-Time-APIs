const axios     = require("axios");
const Sentiment = require("../models/Sentiment");

const ML = process.env.ML_URL || "http://ml:5001";
const ml  = (path, body) => axios.post(`${ML}${path}`, body, { timeout: 20000 }).then(r => r.data);
const mlg = (path, p={}) => axios.get(`${ML}${path}`, { params: p, timeout: 20000 }).then(r => r.data);
const save = doc => new Sentiment(doc).save().catch(e => console.warn("DB skip:", e.message));

exports.predict = async (req, res, next) => {
  try {
    const { text, source = "user" } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "text required" });
    const result = await ml("/predict", { text });
    save({ text: result.text, sentiment: result.sentiment, score: result.score,
           confidence: result.confidence, source });
    res.json(result);
  } catch (e) { next(e); }
};

exports.predictBatch = async (req, res, next) => {
  try {
    const { texts, source = "batch" } = req.body;
    if (!Array.isArray(texts) || !texts.length)
      return res.status(400).json({ error: "texts[] required" });
    const result = await ml("/predict/batch", { texts });
    Sentiment.insertMany(result.results.map(r => ({
      text: r.text, sentiment: r.sentiment,
      score: r.score, confidence: r.confidence, source,
    }))).catch(() => {});
    res.json(result);
  } catch (e) { next(e); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sentiment, source } = req.query;
    const filter = {};
    if (sentiment) filter.sentiment = sentiment;
    if (source)    filter.source    = source;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [docs, total] = await Promise.all([
      Sentiment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Sentiment.countDocuments(filter),
    ]);
    res.json({ data: docs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { next(e); }
};

exports.getStats = async (req, res, next) => {
  try {
    const agg = await Sentiment.aggregate([
      { $group: { _id: "$sentiment", count: { $sum: 1 }, avgScore: { $avg: "$score" } } },
    ]);
    const counts = {}, avg = {};
    for (const g of agg) { counts[g._id] = g.count; avg[g._id] = Math.round(g.avgScore * 100) / 100; }
    res.json({ total: Object.values(counts).reduce((a,b)=>a+b,0), counts, avgConfidence: avg });
  } catch (e) { next(e); }
};

exports.getMetrics      = async (req, res, next) => { try { res.json(await mlg("/metrics")); } catch(e){next(e);} };
exports.getDatasetStats = async (req, res, next) => { try { res.json(await mlg("/dataset/stats")); } catch(e){next(e);} };
exports.retrain = async (req, res, next) => {
  try {
    const { data } = await axios.post(`${ML}/retrain`, {}, { timeout: 180000 });
    res.json(data);
  } catch(e) { next(e); }
};
