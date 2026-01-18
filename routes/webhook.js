const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhook");

// The route path will be /webhook. The parsing will be handled in app.js specifically for this route
// So here we simply define the handler.
router.post("/", webhookController.handleWebhook);

module.exports = router;
