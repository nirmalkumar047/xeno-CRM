const { getFirestore } = require("../config/firebase");

const EVENT_FIELDS = {
  delivered: "deliveredAt",
  opened: "openedAt",
  clicked: "clickedAt",
  failed: "failedAt",
};

const handleCallback = async (req, res) => {
  try {
    const db = getFirestore();
    const { messageId, campaignId, event, timestamp } = req.body;

    if (!messageId || !event) {
      return res.status(400).json({ error: "messageId and event are required" });
    }

    const msgRef = db.collection("messages").doc(messageId);
    const msgDoc = await msgRef.get();

    if (!msgDoc.exists) {
      return res.status(404).json({ error: "Message not found" });
    }

    const timeField = EVENT_FIELDS[event];
    if (!timeField) {
      return res.status(400).json({ error: `Unknown event: ${event}` });
    }

    // Update message status
    await msgRef.update({
      status: event,
      [timeField]: timestamp || new Date().toISOString(),
    });

    // Update campaign stats atomically
    if (campaignId) {
      const campaignRef = db.collection("campaigns").doc(campaignId);
      const campaignDoc = await campaignRef.get();

      if (campaignDoc.exists) {
        const stats = campaignDoc.data().stats || {};
        await campaignRef.update({
          [`stats.${event}`]: (stats[event] || 0) + 1,
        });
      }
    }

    console.log(`Receipt: msg=${messageId} event=${event}`);
    res.json({ received: true, messageId, event });
  } catch (err) {
    console.error("Receipt callback error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const getMessageStatus = async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await db.collection("messages").doc(req.params.messageId).get();
    if (!doc.exists) return res.status(404).json({ error: "Message not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { handleCallback, getMessageStatus };
