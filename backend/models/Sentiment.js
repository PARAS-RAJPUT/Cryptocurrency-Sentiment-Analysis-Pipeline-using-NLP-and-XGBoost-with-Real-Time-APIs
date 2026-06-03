const mongoose = require("mongoose");

const SentimentSchema = new mongoose.Schema(
  {
    text:       { type: String, required: true, maxlength: 2000 },
    sentiment:  { type: String, enum: ["positive","negative","neutral"], required: true },
    score:      { type: Number, min: 0, max: 1 },
    confidence: {
      positive: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
      neutral:  { type: Number, default: 0 },
    },
    source:     { type: String, enum: ["user","twitter","news","batch"], default: "user" },
    meta:       { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

SentimentSchema.index({ createdAt: -1 });
SentimentSchema.index({ sentiment: 1 });
SentimentSchema.index({ source: 1 });

module.exports = mongoose.model("Sentiment", SentimentSchema);
