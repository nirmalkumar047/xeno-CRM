const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/receiptController");

router.post("/callback", receiptController.handleCallback);
router.get("/message/:messageId", receiptController.getMessageStatus);

module.exports = router;
