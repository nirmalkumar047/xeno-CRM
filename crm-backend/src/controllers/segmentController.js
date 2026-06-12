const { getFirestore } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");

const OPERATORS = {
  gt: (a, b) => a > b,
  gte: (a, b) => a >= b,
  lt: (a, b) => a < b,
  lte: (a, b) => a <= b,
  eq: (a, b) => a == b,
  neq: (a, b) => a != b,
  contains: (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
};

const applyRules = (customer, rules) => {
  return rules.every((rule) => {
    let value = customer[rule.field];

    // Handle date-based fields like daysSinceLastOrder
    if (rule.field === "daysSinceLastOrder") {
      if (!customer.lastOrderDate) return false;
      const days = Math.floor(
        (Date.now() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      value = days;
    }

    if (rule.field === "daysSinceJoined") {
      if (!customer.joinedDate) return false;
      const days = Math.floor(
        (Date.now() - new Date(customer.joinedDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      value = days;
    }

    const op = OPERATORS[rule.operator];
    if (!op) return false;
    return op(value, rule.value);
  });
};

const previewSegment = async (req, res) => {
  try {
    const db = getFirestore();
    const { rules } = req.body;
    if (!rules || !rules.length) return res.json({ customers: [], count: 0 });

    const snapshot = await db.collection("customers").get();
    const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const matched = all.filter((c) => applyRules(c, rules));

    res.json({ customers: matched, count: matched.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllSegments = async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("segments").orderBy("createdAt", "desc").get();
    const segments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ segments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSegmentById = async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await db.collection("segments").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Segment not found" });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSegmentCustomers = async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await db.collection("segments").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Segment not found" });

    const { rules } = doc.data();
    const snapshot = await db.collection("customers").get();
    const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const matched = all.filter((c) => applyRules(c, rules));

    res.json({ customers: matched, count: matched.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createSegment = async (req, res) => {
  try {
    const db = getFirestore();
    const { name, description, rules } = req.body;

    // Count matching customers
    const snapshot = await db.collection("customers").get();
    const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const matched = all.filter((c) => applyRules(c, rules));

    const id = uuidv4();
    const segment = {
      id, name, description, rules,
      customerCount: matched.length,
      createdAt: new Date().toISOString(),
    };

    await db.collection("segments").doc(id).set(segment);
    res.status(201).json(segment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteSegment = async (req, res) => {
  try {
    const db = getFirestore();
    await db.collection("segments").doc(req.params.id).delete();
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllSegments, getSegmentById, getSegmentCustomers, createSegment, previewSegment, deleteSegment };
