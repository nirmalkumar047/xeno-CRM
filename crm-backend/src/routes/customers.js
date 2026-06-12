const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

router.get("/", customerController.getAllCustomers);
router.get("/stats", customerController.getCustomerStats);
router.get("/:id", customerController.getCustomerById);
router.post("/", customerController.createCustomer);
router.post("/bulk", customerController.bulkCreateCustomers);

module.exports = router;
