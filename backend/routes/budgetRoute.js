const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const c = require("../controllers/budgetController");

router.use(protect);
router.route("/").get(c.getBudgets).put(c.saveBudget);
router.delete("/:id", c.deleteBudget);

module.exports = router;