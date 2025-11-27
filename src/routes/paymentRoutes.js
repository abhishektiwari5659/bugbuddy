import express from "express";
import { userAuth } from "../middlewares/auth.js";
import paymentInstance from "../utils/razorpay.js";
import Payment from "../models/payments.js";
import { membershipAmount } from "../utils/constant.js";
import crypto from "crypto";

const paymentRouter = express.Router();

// create order
paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const membershipType = (req.body.membershipType || "").toLowerCase();
    const { firstName, lastName, emailId } = req.user; // plain object
    const userId = req.userDoc._id;

    const price = membershipAmount[membershipType];
    if (!price) {
      return res.status(400).json({ success: false, message: "Invalid membership type" });
    }

    const amount = price * 100;

    const order = await paymentInstance.orders.create({
      amount,
      currency: "INR",
      receipt: "receipt#" + Date.now(),
      notes: {
        firstName,
        lastName,
        membershipType,
        emailId,
      },
    });

    const payment = new Payment({
      userId,
      orderId: order.id,
      paymentId: null,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      notes: order.notes,
      email: emailId,
    });

    const savedPayment = await payment.save();

    res.json({
      ...savedPayment.toJSON(),
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// verify payment (called from frontend handler)
paymentRouter.post("/payment/verify", userAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing params" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

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

    // update user document (use req.userDoc which is mongoose doc)
    const userDoc = req.userDoc;

    userDoc.isPremium = true;
    userDoc.membershipType = membershipType;
    // set expiry 30 days from now; change logic if monthly/yearly options later
    userDoc.membershipExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await userDoc.save();

    return res.json({ success: true, message: "Payment verified and membership activated" });
  } catch (error) {
    console.log("verify error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default paymentRouter;
