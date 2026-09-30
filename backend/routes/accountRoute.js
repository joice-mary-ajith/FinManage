const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const c = require("../controllers/accountController");

router.use(protect);
router.route("/").post(c.createAccount).get(c.getAccounts);
router.route("/:id").put(c.updateAccount).delete(c.deleteAccount);

module.exports = router;