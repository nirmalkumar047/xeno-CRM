const { getFirestore } = require("../config/firebase");

const getOverview = async (req, res) => {
  try {
    const db = getFirestore();

    const [customersSnap, campaignsSnap, messagesSnap] = await Promise.all([
      db.collection("customers").get(),
      db.collection("campaigns").get(),
      db.collection("messages").get(),
    ]);

    const campaigns = campaignsSnap.docs.map((d) => d.data());
    const messages = messagesSnap.docs.map((d) => d.data());

    const totalSent = messages.length;
    const delivered = messages.filter((m) => ["delivered", "opened", "clicked"].includes(m.status)).length;
    const opened = messages.filter((m) => ["opened", "clicked"].includes(m.status)).length;
    const clicked = messages.filter((m) => m.status === "clicked").length;
    const failed = messages.filter((m) => m.status === "failed").length;

    res.json({
      totalCustomers: customersSnap.size,
      totalCampaigns: campaignsSnap.size,
      activeCampaigns: campaigns.filter((c) => c.status === "sent").length,
      totalSent,
      delivered,
      opened,
      clicked,
      failed,
      deliveryRate: totalSent ? Math.round((delivered / totalSent) * 100) : 0,
      openRate: delivered ? Math.round((opened / delivered) * 100) : 0,
      clickRate: opened ? Math.round((clicked / opened) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCampaignAnalytics = async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await db.collection("campaigns").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Campaign not found" });

    const campaign = { id: doc.id, ...doc.data() };
    const messagesSnap = await db
      .collection("messages")
      .where("campaignId", "==", req.params.id)
      .get();

    const messages = messagesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const statusBreakdown = messages.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {});

    res.json({ campaign, messages, statusBreakdown, totalMessages: messages.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTrends = async (req, res) => {
  try {
    const db = getFirestore();
    const campaignsSnap = await db
      .collection("campaigns")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const trends = campaignsSnap.docs.map((d) => {
      const c = d.data();
      const sent = c.stats?.sent || 0;
      const delivered = c.stats?.delivered || 0;
      const opened = c.stats?.opened || 0;
      const clicked = c.stats?.clicked || 0;
      return {
        id: d.id,
        name: c.name,
        date: c.sentAt || c.createdAt,
        sent,
        delivered,
        opened,
        clicked,
        openRate: delivered ? Math.round((opened / delivered) * 100) : 0,
        clickRate: opened ? Math.round((clicked / opened) * 100) : 0,
      };
    });

    res.json({ trends });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getOverview, getCampaignAnalytics, getTrends };
