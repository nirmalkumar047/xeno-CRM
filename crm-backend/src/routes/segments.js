const express = require("express");
const router = express.Router();
const segmentController = require("../controllers/segmentController");

router.get("/", segmentController.getAllSegments);
router.get("/:id", segmentController.getSegmentById);
router.get("/:id/customers", segmentController.getSegmentCustomers);
router.post("/", segmentController.createSegment);
router.post("/preview", segmentController.previewSegment);
router.delete("/:id", segmentController.deleteSegment);

module.exports = router;
