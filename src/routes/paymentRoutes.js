import express from "express";
import { userAuth } from "../middlewares/auth.js";
import paymentInstance from "../utils/razorpay.js";
import Payment from "../models/payments.js";
import crypto from "crypto";

const paymentRouter = express.Router();

/* =====================================================
   CREATE ORDER — NOW SUPPORTS MONTHLY + YEARLY BILLING
   ===================================================== */
paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const membershipType = (req.body.membershipType || "").toLowerCase();
    const billingMode = req.body.billingMode || "monthly"; // monthly | yearly
    const selectedPrice = req.body.price; // sent from frontend

    const { firstName, lastName, emailId } = req.user;
    const userId = req.userDoc._id;

    // Price must come from frontend (monthly or yearlyTotal)
    if (!selectedPrice || isNaN(selectedPrice)) {
      return res.status(400).json({ success: false, message: "Invalid price selected" });
    }

    // Razorpay works in paise → multiply by 100
    const amount = Number(selectedPrice) * 100;

    // Create Razorpay order
    const order = await paymentInstance.orders.create({
      amount,
      currency: "INR",
      receipt: "receipt#" + Date.now(),
      notes: {
        firstName,
        lastName,
        emailId,
        membershipType,
        billingMode,
        selectedPrice,
      },
    });

    // Save order in DB
    const payment = await Payment.create({
      userId,
      orderId: order.id,
      paymentId: null,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      notes: order.notes,
      email: emailId,
    });

    return res.json({
      ...payment.toJSON(),
      keyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.log("payment/create error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =====================================================
   VERIFY PAYMENT — NOW APPLIES CORRECT EXPIRY
   ===================================================== */
paymentRouter.post("/payment/verify", userAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing params" });
    }

    // Validate signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id,
        status: "paid",
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found" });
    }

    const membershipType = (payment.notes?.membershipType || "devlite").toLowerCase();
    const billingMode = payment.notes?.billingMode || "monthly";

    // Update User Membership
    const userDoc = req.userDoc;

    userDoc.isPremium = true;
    userDoc.membershipType = membershipType;

    // Correct expiry logic based on billingMode
    if (billingMode === "yearly") {
      userDoc.membershipExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    } else {
      userDoc.membershipExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    await userDoc.save();

    return res.json({
      success: true,
      message: "Payment verified and membership activated",
    });

  } catch (error) {
    console.log("verify error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default paymentRouter;
