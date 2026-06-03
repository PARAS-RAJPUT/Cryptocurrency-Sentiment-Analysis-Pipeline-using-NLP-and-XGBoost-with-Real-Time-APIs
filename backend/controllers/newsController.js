const axios = require("axios");
const ML = process.env.ML_URL || "http://ml:5001";
const mlg = (path, p) => axios.get(`${ML}${path}`, { params: p, timeout: 20000 }).then(r => r.data);

exports.getTwitterFeed = async (req, res, next) => {
  try {
    const { coin="bitcoin", limit=20, sample="true" } = req.query;
    res.json(await mlg("/feed/twitter", { coin, limit, sample }));
  } catch(e) { next(e); }
};

exports.getNewsFeed = async (req, res, next) => {
  try {
    const { topic="crypto", limit=20, sample="true" } = req.query;
    res.json(await mlg("/feed/news", { topic, limit, sample }));
  } catch(e) { next(e); }
};
