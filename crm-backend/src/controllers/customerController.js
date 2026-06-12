const { getFirestore } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");

const getAllCustomers = async (req, res) => {
  try {
    const db = getFirestore();
    const { limit = 100, search } = req.query;
    let query = db.collection("customers").limit(parseInt(limit));
    const snapshot = await query.get();
    let customers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (search) {
      const s = search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(s) ||
          c.email?.toLowerCase().includes(s) ||
          c.city?.toLowerCase().includes(s)
      );
    }

    res.json({ customers, total: customers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await db.collection("customers").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Customer not found" });

    const ordersSnap = await db
      .collection("orders")
      .where("customerId", "==", req.params.id)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ id: doc.id, ...doc.data(), orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCustomerStats = async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("customers").get();
    const customers = snapshot.docs.map((d) => d.data());

    const total = customers.length;
    const avgSpend = customers.reduce((s, c) => s + (c.totalSpend || 0), 0) / total;
    const cities = {};
    customers.forEach((c) => {
      if (c.city) cities[c.city] = (cities[c.city] || 0) + 1;
    });

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const active = customers.filter(
      (c) => c.lastOrderDate && new Date(c.lastOrderDate).getTime() > thirtyDaysAgo
    ).length;

    res.json({ total, avgSpend: Math.round(avgSpend), active, cities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const db = getFirestore();
    const id = uuidv4();
    const customer = { ...req.body, id, createdAt: new Date().toISOString() };
    await db.collection("customers").doc(id).set(customer);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const bulkCreateCustomers = async (req, res) => {
  try {
    const db = getFirestore();
    const { customers } = req.body;
    const batch = db.batch();
    customers.forEach((c) => {
      const id = c.id || uuidv4();
      batch.set(db.collection("customers").doc(id), { ...c, id });
    });
    await batch.commit();
    res.status(201).json({ created: customers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllCustomers, getCustomerById, getCustomerStats, createCustomer, bulkCreateCustomers };
