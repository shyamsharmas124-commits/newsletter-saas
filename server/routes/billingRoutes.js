const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const {
  createOrder,
  verifyPayment,
  getSubscriptionStatus,
  cancelSubscription,
} = require("../controllers/billingController");

router.use(requireAuth);

router.post("/:orgId/create-order", requireRole("owner"), createOrder);
router.post("/:orgId/verify-payment", requireRole("owner"), verifyPayment);
router.get("/:orgId/status", requireRole("subscriber"), getSubscriptionStatus);
router.post("/:orgId/cancel", requireRole("owner"), cancelSubscription);

module.exports = router;