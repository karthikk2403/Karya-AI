import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import crypto from "crypto";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let razorpayInstance: Razorpay | null = null;

function getRazorpay() {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required");
    }
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}

// Initialize Firebase Admin
let firebaseConfig: any = {};
try {
  const configPath = new URL("./firebase-applet-config.json", import.meta.url);
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } else {
    console.warn("firebase-applet-config.json not found. Using environment variables if available.");
  }
} catch (error) {
  console.error("Error loading firebase-applet-config.json:", error);
}

const projectId = process.env.GOOGLE_CLOUD_PROJECT || firebaseConfig.projectId;
const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: projectId,
  });
}

const db = getFirestore(databaseId);

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not configured. Skipping email send.");
    return;
  }

  try {
    await transporter.sendMail({
      from: `"KARYA" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

console.log("Firebase Admin initialized:", {
  projectId,
  databaseId,
  envProjectId: process.env.GOOGLE_CLOUD_PROJECT,
  configProjectId: firebaseConfig.projectId
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/wallet-balance", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
      const userDoc = await db.collection("users").doc(userId as string).get();
      const data = userDoc.data();
      const balance = userDoc.exists ? (data?.walletBalance || 0) : 0;
      const premiumUntil = data?.premiumUntil || null;
      const isPremium = premiumUntil ? new Date(premiumUntil) > new Date() : false;
      res.json({ balance, isPremium, premiumUntil });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/resume-history", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
      const snapshot = await db.collection("resumeHistory")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();
      
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/save-resume", async (req, res) => {
    const { userId, jobId, company, role, resumeText, atsScore } = req.body;
    if (!userId || !resumeText) return res.status(400).json({ error: "Missing required fields" });

    try {
      const historyRef = db.collection("resumeHistory").doc();
      await historyRef.set({
        userId,
        jobId: jobId || null,
        company: company || "Unknown",
        role: role || "Tailored Resume",
        resumeText,
        atsScore: atsScore || 0,
        createdAt: new Date().toISOString()
      });
      res.json({ status: "success", id: historyRef.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    const { adminId } = req.query;
    if (!adminId) return res.status(400).json({ error: "Admin ID required" });

    try {
      const adminDoc = await db.collection("users").doc(adminId as string).get();
      const adminData = adminDoc.data();
      if (adminData?.role !== "admin" && adminData?.email !== "mkarthikeya24@gmail.com" && adminData?.email !== "Kbsn1170@gmail.com") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const transactionsSnapshot = await db.collection("wallet_transactions").get();
      const resumesSnapshot = await db.collection("resumeHistory").get();
      const usersSnapshot = await db.collection("users").get();

      let totalRevenue = 0;
      const userRevenue: Record<string, number> = {};
      const recentPayments: any[] = [];

      transactionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.type === "topup" || data.type === "subscription") {
          const amount = data.amount || 0;
          const userId = data.userId;
          totalRevenue += amount;
          userRevenue[userId] = (userRevenue[userId] || 0) + amount;
          recentPayments.push({ id: doc.id, ...data });
        }
      });

      // Sort recent payments
      recentPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const stats = {
        totalRevenue,
        totalUsers: usersSnapshot.size,
        totalResumes: resumesSnapshot.size,
        revenuePerUser: userRevenue,
        recentPayments: recentPayments.slice(0, 10),
        recentResumes: resumesSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10)
      };

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/update-wallet", async (req, res) => {
    const { adminId, userId, amount, reason } = req.body;
    if (!adminId || !userId || amount === undefined) return res.status(400).json({ error: "Missing fields" });

    try {
      const adminDoc = await db.collection("users").doc(adminId).get();
      const adminData = adminDoc.data();
      if (adminData?.role !== "admin" && adminData?.email !== "mkarthikeya24@gmail.com" && adminData?.email !== "Kbsn1170@gmail.com") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const userRef = db.collection("users").doc(userId);
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const currentBalance = userDoc.exists ? (userDoc.data()?.walletBalance || 0) : 0;
        
        transaction.set(userRef, {
          walletBalance: currentBalance + amount,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        const transactionRef = db.collection("wallet_transactions").doc();
        transaction.set(transactionRef, {
          userId,
          amount,
          type: amount >= 0 ? "admin_add" : "admin_deduct",
          reason: reason || "Admin adjustment",
          adminId,
          createdAt: new Date().toISOString()
        });
      });

      res.json({ status: "success" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/user-history", async (req, res) => {
    const { adminId, userId } = req.query;
    if (!adminId || !userId) return res.status(400).json({ error: "Missing fields" });

    try {
      const adminDoc = await db.collection("users").doc(adminId as string).get();
      const adminData = adminDoc.data();
      if (adminData?.role !== "admin" && adminData?.email !== "mkarthikeya24@gmail.com" && adminData?.email !== "Kbsn1170@gmail.com") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const snapshot = await db.collection("resumeHistory")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();
      
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/deduct-wallet", async (req, res) => {
    const { userId, amount, reason } = req.body;
    if (!userId || !amount) return res.status(400).json({ error: "Missing fields" });

    try {
      const userRef = db.collection("users").doc(userId);
      
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const currentBalance = userDoc.exists ? (userDoc.data()?.walletBalance || 0) : 0;
        const userEmail = userDoc.data()?.email;

        if (currentBalance < amount) {
          throw new Error("Insufficient balance");
        }

        transaction.update(userRef, {
          walletBalance: currentBalance - amount,
          updatedAt: new Date().toISOString()
        });

        // Log transaction
        const transactionRef = db.collection("wallet_transactions").doc();
        transaction.set(transactionRef, {
          userId,
          amount: -amount,
          type: "deduction",
          reason: reason || "Resume Download",
          createdAt: new Date().toISOString()
        });

        // Send Download Confirmation Email
        if (userEmail && reason?.includes("Resume Download")) {
          sendEmail(
            userEmail,
            "Congratulations! Your Resume is Ready",
            `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #F9F9F7; color: #0A0A0A; border: 1px solid #E5E5E5; border-radius: 24px;">
              <h1 style="font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; margin-bottom: 24px;">KARYA</h1>
              <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Congratulations!</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #4A4A4A; margin-bottom: 24px;">
                Your resume has been successfully tailored and downloaded. You're one step closer to your dream job!
              </p>
              <div style="padding: 24px; background-color: #FFFFFF; border: 1px solid #E5E5E5; border-radius: 16px; margin-bottom: 32px;">
                <p style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #C5A059; margin-bottom: 8px;">Resume Details</p>
                <p style="font-size: 18px; font-weight: 700; margin: 0;">${reason}</p>
              </div>
              <p style="font-size: 14px; color: #888888; margin-bottom: 0;">
                Best regards,<br>
                The KARYA Team
              </p>
            </div>
            `
          );
        }
      });

      res.json({ status: "success" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/send-welcome-email", async (req, res) => {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    await sendEmail(
      email,
      "Welcome to KARYA - Your Professional Standard",
      `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #F9F9F7; color: #0A0A0A; border: 1px solid #E5E5E5; border-radius: 24px;">
        <h1 style="font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; margin-bottom: 24px;">KARYA</h1>
        <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Welcome, ${name || 'Professional'}!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #4A4A4A; margin-bottom: 24px;">
          Congratulations on joining KARYA. You've just taken the first step towards a more intelligent, professional resume.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #4A4A4A; margin-bottom: 32px;">
          Our AI-powered platform is designed to help you stand out in the competitive job market. Start tailoring your resume today and see the difference.
        </p>
        <a href="https://karya.app/dashboard" style="display: inline-block; padding: 16px 32px; background-color: #0A0A0A; color: #FFFFFF; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Go to Dashboard</a>
        <p style="font-size: 14px; color: #888888; margin-top: 40px; margin-bottom: 0;">
          Best regards,<br>
          The KARYA Team
        </p>
      </div>
      `
    );

    res.json({ status: "success" });
  });

  app.post("/api/notify-download", async (req, res) => {
    const { userId, resumeName } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    try {
      const userDoc = await db.collection("users").doc(userId).get();
      const userEmail = userDoc.data()?.email;

      if (userEmail) {
        sendEmail(
          userEmail,
          "Congratulations! Your Resume is Ready",
          `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #F9F9F7; color: #0A0A0A; border: 1px solid #E5E5E5; border-radius: 24px;">
            <h1 style="font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; margin-bottom: 24px;">KARYA</h1>
            <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Congratulations!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #4A4A4A; margin-bottom: 24px;">
              Your resume has been successfully tailored and downloaded. You're one step closer to your dream job!
            </p>
            <div style="padding: 24px; background-color: #FFFFFF; border: 1px solid #E5E5E5; border-radius: 16px; margin-bottom: 32px;">
              <p style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #C5A059; margin-bottom: 8px;">Resume Details</p>
              <p style="font-size: 18px; font-weight: 700; margin: 0;">${resumeName || 'Tailored Resume'}</p>
            </div>
            <p style="font-size: 14px; color: #888888; margin-bottom: 0;">
              Best regards,<br>
              The KARYA Team
            </p>
          </div>
          `
        );
      }
      res.json({ status: "success" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/create-order", async (req, res) => {
    const { userId, amount, type } = req.body;
    const razorpay = getRazorpay();

    try {
      if (type === "subscription") {
        if (amount !== 399) return res.status(400).json({ error: "Invalid subscription amount" });
      } else {
        if (!amount || amount < 20 || amount > 2000) {
          return res.status(400).json({ error: "Amount must be between 20 and 2000" });
        }
      }

      const order = await razorpay.orders.create({
        amount: amount * 100, // amount in paise
        currency: "INR",
        receipt: `${type || 'wallet'}_${Date.now()}`,
        notes: { userId, type: type || "wallet_topup", amount },
      });
      return res.json(order);
    } catch (error: any) {
      console.error("Razorpay Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;
      const secret = process.env.RAZORPAY_KEY_SECRET;

      if (!secret) {
        throw new Error("RAZORPAY_KEY_SECRET is not configured");
      }

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ status: "failure", error: "Missing payment details" });
      }

      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generated_signature = hmac.digest("hex");

      if (generated_signature === razorpay_signature) {
        // Prevent reuse of payment IDs
        const existing = await db.collection("wallet_transactions")
          .where("razorpayPaymentId", "==", razorpay_payment_id)
          .get();

        if (!existing.empty) {
          return res.status(400).json({ status: "failure", error: "This payment ID has already been used" });
        }

        const razorpay = getRazorpay();
        const order = await razorpay.orders.fetch(razorpay_order_id);
        const notes = order.notes as any;
        const finalUserId = notes?.userId || userId;
        const topupAmount = Number(order.amount) / 100;
        const type = notes?.type || "wallet_topup";

        const userRef = db.collection("users").doc(finalUserId);
        await db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          const data = userDoc.data();
          const currentBalance = userDoc.exists ? (data?.walletBalance || 0) : 0;
          
          if (type === "subscription") {
            const premiumUntil = new Date();
            premiumUntil.setMonth(premiumUntil.getMonth() + 1);
            transaction.set(userRef, {
              premiumUntil: premiumUntil.toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } else {
            transaction.set(userRef, {
              walletBalance: currentBalance + topupAmount,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }

          const transactionRef = db.collection("wallet_transactions").doc();
          transaction.set(transactionRef, {
            userId: finalUserId,
            amount: topupAmount,
            type: type === "subscription" ? "subscription" : "topup",
            razorpayPaymentId: razorpay_payment_id,
            createdAt: new Date().toISOString()
          });
        });
        res.json({ status: "success" });
      } else {
        console.error("Signature mismatch:", { generated_signature, razorpay_signature });
        res.status(400).json({ status: "failure", error: "Invalid signature" });
      }
    } catch (error: any) {
      console.error("Verification Error:", error);
      res.status(500).json({ status: "error", error: error.message });
    }
  });

  app.post("/api/webhook", async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!secret || !signature) {
      return res.status(400).send("Webhook Error: Missing signature or secret");
    }

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(JSON.stringify(req.body));
    const expectedSignature = hmac.digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).send("Webhook Error: Invalid signature");
    }

    const event = req.body;
    try {
      switch (event.event) {
        case "payment.captured": {
          const payment = event.payload.payment.entity;
          const { userId, type } = payment.notes || {};

          if (type === "wallet_topup" || type === "subscription") {
            const finalUserId = userId || payment.notes?.userId;
            const topupAmount = Number(payment.amount) / 100;

            if (finalUserId) {
              const existing = await db.collection("wallet_transactions")
                .where("razorpayPaymentId", "==", payment.id)
                .get();
              
              if (existing.empty) {
                const userRef = db.collection("users").doc(finalUserId);
                await db.runTransaction(async (transaction) => {
                  const userDoc = await transaction.get(userRef);
                  const data = userDoc.data();
                  const currentBalance = userDoc.exists ? (data?.walletBalance || 0) : 0;
                  
                  if (type === "subscription") {
                    const premiumUntil = new Date();
                    premiumUntil.setMonth(premiumUntil.getMonth() + 1);
                    transaction.set(userRef, {
                      premiumUntil: premiumUntil.toISOString(),
                      updatedAt: new Date().toISOString()
                    }, { merge: true });
                  } else {
                    transaction.set(userRef, {
                      walletBalance: currentBalance + topupAmount,
                      updatedAt: new Date().toISOString()
                    }, { merge: true });
                  }

                  const transactionRef = db.collection("wallet_transactions").doc();
                  transaction.set(transactionRef, {
                    userId: finalUserId,
                    amount: topupAmount,
                    type: type === "subscription" ? "subscription" : "topup",
                    razorpayPaymentId: payment.id,
                    createdAt: new Date().toISOString()
                  });
                });
              }
            }
          }
          break;
        }
      }
    } catch (err: any) {
      console.error("Error processing webhook event:", err);
      return res.status(500).send("Internal Server Error");
    }

    res.json({ received: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
