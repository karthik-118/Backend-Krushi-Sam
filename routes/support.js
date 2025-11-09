import express from "express";
import fetch from "node-fetch";

const router = express.Router();

/**
 * POST /api/support/ticket
 * Body: { message, user: { id, name, email }, context?: { url, ts } }
 */
router.post("/ticket", async (req, res) => {
  try {
    const { message, user, context } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const url = process.env.CS_AUTOMATION_WEBHOOK;
    if (!url) {
      return res
        .status(500)
        .json({ message: "Automation webhook is not configured" });
    }

    const payload = {
      type: "support_ticket",
      message: String(message),
      user: user || {},
      context: {
        ...context,
        source: "farmcom-frontend",
      },
    };

    const headers = {
      "Content-Type": "application/json",
    };
    if (process.env.CS_AUTOMATION_SECRET) {
      headers["X-CS-Automation-Secret"] = process.env.CS_AUTOMATION_SECRET;
    }

    const out = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!out.ok) {
      const txt = await out.text();
      console.error("Automation webhook failed:", out.status, txt);
      return res.status(502).json({ message: "Automation call failed" });
    }

    return res.json({ message: "Ticket forwarded to automation" });
  } catch (err) {
    console.error("POST /api/support/ticket error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
