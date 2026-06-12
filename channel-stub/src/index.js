require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// Simulation probabilities
const PROBS = {
  delivered: 0.92,  // 92% delivery rate
  opened: 0.45,     // 45% open rate of delivered
  clicked: 0.28,    // 28% click rate of opened
  failed: 0.08,     // 8% failure rate
};

// Delays in ms (simulating real async delivery)
const DELAYS = {
  delivered: () => randomBetween(1000, 4000),
  opened: () => randomBetween(3000, 10000),
  clicked: () => randomBetween(8000, 18000),
};

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function fireCallback(callbackUrl, payload, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await axios.post(callbackUrl, payload, { timeout: 8000 });
      console.log(`✅ Callback fired: msg=${payload.messageId} event=${payload.event}`);
      return;
    } catch (err) {
      console.warn(`⚠️ Callback attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  console.error(`❌ Callback permanently failed for msg=${payload.messageId}`);
}

async function simulateMessageLifecycle(message) {
  const { messageId, campaignId, callbackUrl } = message;

  const isDelivered = Math.random() < PROBS.delivered;

  if (!isDelivered) {
    // Simulate failure
    setTimeout(async () => {
      await fireCallback(callbackUrl, {
        messageId,
        campaignId,
        event: "failed",
        timestamp: new Date().toISOString(),
      });
    }, randomBetween(500, 2000));
    return;
  }

  // Step 1: Delivered
  setTimeout(async () => {
    await fireCallback(callbackUrl, {
      messageId,
      campaignId,
      event: "delivered",
      timestamp: new Date().toISOString(),
    });

    // Step 2: Opened
    const isOpened = Math.random() < PROBS.opened;
    if (!isOpened) return;

    setTimeout(async () => {
      await fireCallback(callbackUrl, {
        messageId,
        campaignId,
        event: "opened",
        timestamp: new Date().toISOString(),
      });

      // Step 3: Clicked
      const isClicked = Math.random() < PROBS.clicked;
      if (!isClicked) return;

      setTimeout(async () => {
        await fireCallback(callbackUrl, {
          messageId,
          campaignId,
          event: "clicked",
          timestamp: new Date().toISOString(),
        });
      }, DELAYS.clicked());
    }, DELAYS.opened());
  }, DELAYS.delivered());
}

// Main send endpoint
app.post("/send", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    console.log(`📨 Received ${messages.length} messages to simulate`);

    // Immediately acknowledge
    res.json({
      accepted: messages.length,
      status: "processing",
      message: "Messages accepted for delivery simulation",
    });

    // Process each message asynchronously with staggered start
    messages.forEach((msg, index) => {
      setTimeout(() => {
        simulateMessageLifecycle(msg).catch(console.error);
      }, index * 100); // stagger by 100ms each to avoid thundering herd
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "biteloop-channel-stub" });
});

// Stats endpoint for debugging
app.get("/stats", (req, res) => {
  res.json({
    probabilities: PROBS,
    delays: {
      delivered: "1-4 seconds",
      opened: "3-10 seconds",
      clicked: "8-18 seconds",
    },
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`BiteLoop Channel Stub running on port ${PORT}`);
  console.log(`Delivery rate: ${PROBS.delivered * 100}%`);
  console.log(`Open rate: ${PROBS.opened * 100}%`);
  console.log(`Click rate: ${PROBS.clicked * 100}%`);
});
