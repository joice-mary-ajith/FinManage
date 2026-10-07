const router = require("express").Router();

const protect =
  require("../middleware/authMiddleware");

const c =
  require("../controllers/authController");


router.post(
  "/register",
  c.register
);

router.post(
  "/login",
  c.login
);

router.post(
  "/forgot-password",
  c.forgotPassword
);

router.post(
  "/reset-password",
  c.resetPassword
);

router.get(
  "/me",
  protect,
  c.getMe
);

module.exports = router;