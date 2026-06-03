const router = require("express").Router();
const c      = require("../controllers/newsController");

router.get("/twitter", c.getTwitterFeed);
router.get("/news",    c.getNewsFeed);

module.exports = router;
