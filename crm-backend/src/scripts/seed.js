require("dotenv").config();
const { getFirestore } = require("../config/firebase");

const MENU_ITEMS = [
  "Classic Smash Burger",
  "Crispy Chicken Wrap",
  "Loop Fries",
  "BiteBox Combo",
  "Loaded Nachos",
  "Choco Lava Shake",
  "Spicy Crunch Burger",
  "Veggie Pocket",
];

const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad"];

const FIRST_NAMES = [
  "Aarav", "Ananya", "Rohan", "Priya", "Karan", "Sneha", "Vikram", "Neha",
  "Arjun", "Pooja", "Rahul", "Meera", "Aditya", "Kavya", "Siddharth", "Riya",
  "Nikhil", "Shreya", "Varun", "Divya", "Harsh", "Anjali", "Mohit", "Tanvi",
  "Kunal", "Swati", "Arnav", "Ishita", "Dhruv", "Natasha", "Yash", "Simran",
  "Akash", "Preeti", "Vivek", "Komal", "Manish", "Sonal", "Ravi", "Aditi",
];

const LAST_NAMES = [
  "Sharma", "Patel", "Singh", "Kumar", "Gupta", "Joshi", "Nair", "Mehta",
  "Agarwal", "Verma", "Reddy", "Iyer", "Malhotra", "Bose", "Desai", "Kapoor",
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function generateCustomers(count = 100) {
  const customers = [];

  for (let i = 0; i < count; i++) {
    const firstName = randomFrom(FIRST_NAMES);
    const lastName = randomFrom(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 99)}@email.com`;
    const city = randomFrom(CITIES);
    const favouriteItem = randomFrom(MENU_ITEMS);
    const orderCount = randomInt(1, 40);
    const totalSpend = orderCount * randomInt(120, 450);
    const joinedDaysAgo = randomInt(30, 730);
    const lastOrderDaysAgo = randomInt(1, 120);

    customers.push({
      id: `cust_${String(i + 1).padStart(3, "0")}`,
      name,
      email,
      phone: `+91${randomInt(7000000000, 9999999999)}`,
      city,
      favouriteItem,
      orderCount,
      totalSpend,
      joinedDate: randomDate(joinedDaysAgo),
      lastOrderDate: randomDate(lastOrderDaysAgo),
      createdAt: randomDate(joinedDaysAgo),
    });
  }

  return customers;
}

function generateOrders(customers) {
  const orders = [];

  customers.forEach((customer) => {
    const numOrders = Math.min(customer.orderCount, 5); // seed up to 5 orders per customer
    for (let i = 0; i < numOrders; i++) {
      const items = [
        { name: randomFrom(MENU_ITEMS), qty: randomInt(1, 2), price: randomInt(120, 350) },
      ];
      if (Math.random() > 0.5) {
        items.push({ name: randomFrom(MENU_ITEMS), qty: 1, price: randomInt(80, 200) });
      }
      const totalAmount = items.reduce((s, item) => s + item.price * item.qty, 0);

      orders.push({
        id: `order_${customer.id}_${i + 1}`,
        customerId: customer.id,
        customerName: customer.name,
        items,
        totalAmount,
        createdAt: randomDate(randomInt(1, 200)),
      });
    }
  });

  return orders;
}

async function seed() {
  console.log("🌱 Seeding BiteLoop CRM...");
  const db = getFirestore();

  const customers = generateCustomers(100);
  const orders = generateOrders(customers);

  console.log(`Seeding ${customers.length} customers...`);
  const custBatch = db.batch();
  customers.forEach((c) => custBatch.set(db.collection("customers").doc(c.id), c));
  await custBatch.commit();
  console.log("✅ Customers seeded");

  console.log(`Seeding ${orders.length} orders...`);
  // Firestore batch max 500
  for (let i = 0; i < orders.length; i += 400) {
    const chunk = orders.slice(i, i + 400);
    const batch = db.batch();
    chunk.forEach((o) => batch.set(db.collection("orders").doc(o.id), o));
    await batch.commit();
  }
  console.log("✅ Orders seeded");

  // Seed a default segment
  const defaultSegments = [
    {
      id: "seg_winback",
      name: "Win-Back Customers",
      description: "Customers who haven't ordered in over 30 days",
      rules: [{ field: "daysSinceLastOrder", operator: "gt", value: 30 }],
      customerCount: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "seg_loyalists",
      name: "Loyal Regulars",
      description: "High-value customers with 10+ orders",
      rules: [{ field: "orderCount", operator: "gte", value: 10 }],
      customerCount: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "seg_mumbai",
      name: "Mumbai Foodies",
      description: "All customers from Mumbai",
      rules: [{ field: "city", operator: "eq", value: "Mumbai" }],
      customerCount: 0,
      createdAt: new Date().toISOString(),
    },
  ];

  const segBatch = db.batch();
  defaultSegments.forEach((s) => segBatch.set(db.collection("segments").doc(s.id), s));
  await segBatch.commit();
  console.log("✅ Default segments seeded");

  console.log("🎉 BiteLoop CRM seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
