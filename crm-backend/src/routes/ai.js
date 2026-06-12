const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

router.post("/chat", aiController.chat);
router.post("/parse-segment", aiController.parseSegment);
router.post("/draft-message", aiController.draftMessage);

module.exports = router;
