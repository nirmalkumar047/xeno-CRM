const { getFirestore } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const CHANNEL_STUB_URL = process.env.CHANNEL_STUB_URL || "http://localhost:5000";
const CRM_RECEIPT_URL = process.env.CRM_RECEIPT_URL || "http://localhost:4000";

const getAllCampaigns = async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("campaigns").orderBy("createdAt", "desc").get();
    const campaigns = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCampaignById = async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await db.collection("campaigns").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Campaign not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCampaignMessages = async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection("messages")
      .where("campaignId", "==", req.params.id)
      .get();
    const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCampaign = async (req, res) => {
  try {
    const db = getFirestore();
    const { name, segmentId, subject, messageBody, channel = "email" } = req.body;

    const id = uuidv4();
    const campaign = {
      id, name, segmentId, subject, messageBody, channel,
      status: "draft",
      createdAt: new Date().toISOString(),
      sentAt: null,
      stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 },
    };

    await db.collection("campaigns").doc(id).set(campaign);
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const sendCampaign = async (req, res) => {
  try {
    const db = getFirestore();
    const campaignDoc = await db.collection("campaigns").doc(req.params.id).get();
    if (!campaignDoc.exists) return res.status(404).json({ error: "Campaign not found" });

    const campaign = { id: campaignDoc.id, ...campaignDoc.data() };
    if (campaign.status === "sent" || campaign.status === "sending") {
      return res.status(400).json({ error: "Campaign already sent or sending" });
    }

    // Get segment customers
    const segmentDoc = await db.collection("segments").doc(campaign.segmentId).get();
    if (!segmentDoc.exists) return res.status(404).json({ error: "Segment not found" });

    const { rules } = segmentDoc.data();

    // Apply segment rules
    const { applyRulesExport } = require("./segmentController");
    const customersSnap = await db.collection("customers").get();
    const allCustomers = customersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // inline rule application since we can't easily import
    const OPERATORS = {
      gt: (a, b) => a > b, gte: (a, b) => a >= b,
      lt: (a, b) => a < b, lte: (a, b) => a <= b,
      eq: (a, b) => a == b, neq: (a, b) => a != b,
      contains: (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
    };

    const applyRules = (customer, rules) =>
      rules.every((rule) => {
        let value = customer[rule.field];
        if (rule.field === "daysSinceLastOrder") {
          if (!customer.lastOrderDate) return false;
          value = Math.floor((Date.now() - new Date(customer.lastOrderDate).getTime()) / 86400000);
        }
        if (rule.field === "daysSinceJoined") {
          if (!customer.joinedDate) return false;
          value = Math.floor((Date.now() - new Date(customer.joinedDate).getTime()) / 86400000);
        }
        const op = OPERATORS[rule.operator];
        return op ? op(value, rule.value) : false;
      });

    const recipients = allCustomers.filter((c) => applyRules(c, rules));

    if (recipients.length === 0) {
      return res.status(400).json({ error: "No customers match this segment" });
    }

    // Update campaign to sending
    await db.collection("campaigns").doc(campaign.id).update({
      status: "sending",
      sentAt: new Date().toISOString(),
      "stats.sent": recipients.length,
    });

    // Create message records and dispatch to channel stub
    const batch = db.batch();
    const messages = recipients.map((customer) => {
      const msgId = uuidv4();
      const personalizedBody = campaign.messageBody
        .replace(/\{name\}/g, customer.name)
        .replace(/\{firstName\}/g, customer.name.split(" ")[0])
        .replace(/\{favouriteItem\}/g, customer.favouriteItem || "your favourite meal");

      const msg = {
        id: msgId,
        campaignId: campaign.id,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        subject: campaign.subject,
        body: personalizedBody,
        channel: campaign.channel,
        status: "queued",
        sentAt: new Date().toISOString(),
        deliveredAt: null,
        openedAt: null,
        clickedAt: null,
        failedAt: null,
      };
      batch.set(db.collection("messages").doc(msgId), msg);
      return msg;
    });

    await batch.commit();

    // Fire off to channel stub asynchronously (don't await)
    dispatchToChannelStub(messages, campaign).catch(console.error);

    res.json({
      success: true,
      campaignId: campaign.id,
      recipientCount: recipients.length,
      message: `Campaign dispatched to ${recipients.length} customers`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function dispatchToChannelStub(messages, campaign) {
  const db = getFirestore();
  try {
    const payload = messages.map((m) => ({
      messageId: m.id,
      campaignId: m.campaignId,
      recipient: { id: m.customerId, name: m.customerName, email: m.customerEmail },
      subject: m.subject,
      body: m.body,
      channel: m.channel,
      callbackUrl: `${CRM_RECEIPT_URL}/api/receipts/callback`,
    }));

    await axios.post(`${CHANNEL_STUB_URL}/send`, { messages: payload }, { timeout: 10000 });

    await db.collection("campaigns").doc(campaign.id).update({ status: "sent" });
  } catch (err) {
    console.error("Channel stub dispatch failed:", err.message);
    await db.collection("campaigns").doc(campaign.id).update({ status: "failed" });
  }
}

const deleteCampaign = async (req, res) => {
  try {
    const db = getFirestore();
    await db.collection("campaigns").doc(req.params.id).delete();
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllCampaigns, getCampaignById, getCampaignMessages, createCampaign, sendCampaign, deleteCampaign };
