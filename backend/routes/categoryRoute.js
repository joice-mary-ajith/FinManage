const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const c = require("../controllers/categoryController");

router.use(protect);
router.route("/").get(c.getCategories).post(c.addCategory);

module.exports = router;