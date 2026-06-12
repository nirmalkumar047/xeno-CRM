const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaignController");

router.get("/", campaignController.getAllCampaigns);
router.get("/:id", campaignController.getCampaignById);
router.get("/:id/messages", campaignController.getCampaignMessages);
router.post("/", campaignController.createCampaign);
router.post("/:id/send", campaignController.sendCampaign);
router.delete("/:id", campaignController.deleteCampaign);

module.exports = router;
