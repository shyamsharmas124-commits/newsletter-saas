const crypto = require("crypto");
const Organization = require("../models/Organization");

const createOrder = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.orgId);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    if (org.subscriptionStatus === "active") {
      return res.status(400).json({ message: "Already has an active subscription" });
    }

    const orderId = `order_${crypto.randomBytes(8).toString("hex")}`;
    const secret = process.env.PAYMENT_SECRET || "mock_secret";
    const signature = crypto
      .createHmac("sha256", secret)
      .update(orderId)
      .digest("hex");

    res.status(200).json({
      orderId,
      amount: 99900,
      currency: "INR",
      signature,
    });
  } catch (err) {
    console.error("Create order error:", err.message);
    res.status(500).json({ message: "Error creating order" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;

    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    const secret = process.env.PAYMENT_SECRET || "mock_secret";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(order_id)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const org = await Organization.findById(req.params.orgId);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    await Organization.findByIdAndUpdate(req.params.orgId, {
      subscriptionStatus: "active",
      razorpayOrderId: order_id,
      razorpayPaymentId: payment_id,
    });

    res.status(200).json({ message: "Payment verified and subscription activated" });
  } catch (err) {
    console.error("Verify payment error:", err.message);
    res.status(500).json({ message: "Error verifying payment" });
  }
};

const getSubscriptionStatus = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.orgId)
      .select("subscriptionStatus name")
      .lean();

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.status(200).json({
      subscriptionStatus: org.subscriptionStatus,
      hasActiveSubscription: org.subscriptionStatus === "active",
    });
  } catch (err) {
    console.error("Get status error:", err.message);
    res.status(500).json({ message: "Error fetching subscription status" });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.orgId);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    if (org.subscriptionStatus !== "active") {
      return res.status(400).json({ message: "No active subscription to cancel" });
    }

    await Organization.findByIdAndUpdate(req.params.orgId, {
      subscriptionStatus: "canceled",
      razorpayOrderId: null,
      razorpayPaymentId: null,
    });

    res.status(200).json({ message: "Subscription cancelled" });
  } catch (err) {
    console.error("Cancel error:", err.message);
    res.status(500).json({ message: "Error cancelling subscription" });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getSubscriptionStatus,
  cancelSubscription,
};