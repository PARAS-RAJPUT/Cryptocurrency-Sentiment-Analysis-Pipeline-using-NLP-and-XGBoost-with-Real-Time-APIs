const router = require("express").Router();
const c      = require("../controllers/sentimentController");

router.post("/predict",       c.predict);
router.post("/predict/batch", c.predictBatch);
router.get( "/history",       c.getHistory);
router.get( "/stats",         c.getStats);
router.get( "/metrics",       c.getMetrics);
router.get( "/dataset/stats", c.getDatasetStats);
router.post("/retrain",       c.retrain);

module.exports = router;
