const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const c = require("../controllers/analyticsController");

router.use(protect);
router.get("/summary", c.summary);
router.get("/category-breakdown", c.categoryBreakdown);
router.get("/trend", c.trend);
router.get("/export", c.exportCsv);

module.exports = router;