const router = require("express").Router();

const protect =
  require("../middleware/authMiddleware");

const requireAdmin =
  require("../middleware/adminMiddleware");

const c =
  require("../controllers/adminController");

// Every admin route requires:
// 1. Valid JWT
// 2. Active user
// 3. Admin role

router.use(protect);
router.use(requireAdmin);


// Statistics
router.get(
  "/stats",
  c.getStats
);


// Users
router.get(
  "/users",
  c.getUsers
);

router.patch(
  "/users/:id/deactivate",
  c.deactivateUser
);

router.patch(
  "/users/:id/activate",
  c.activateUser
);


// Default categories
router.get(
  "/categories",
  c.getDefaultCategories
);

router.post(
  "/categories",
  c.addDefaultCategory
);

router.put(
  "/categories/:id",
  c.updateDefaultCategory
);

router.delete(
  "/categories/:id",
  c.deleteDefaultCategory
);

module.exports = router;