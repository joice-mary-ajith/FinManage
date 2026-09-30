const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const c = require("../controllers/transactionController");

router.use(protect);
router.route("/").post(c.createTransaction).get(c.getTransactions);
router.route("/:id").put(c.updateTransaction).delete(c.deleteTransaction);

module.exports = router;