const express = require("express");

const router = express.Router();

const {
  getConversationHistory,
  getConversation,
  sendMessage,
  deleteConversation,
} = require("../controllers/careerCopilotController");

const {
  protect,
} = require("../middleware/authMiddleware");

/*
============================================================
CAREER COPILOT HISTORY
GET /api/career-copilot/history
============================================================
*/

router.get(
  "/history",
  protect,
  getConversationHistory
);

/*
============================================================
SEND MESSAGE
POST /api/career-copilot/chat
============================================================
*/

router.post(
  "/chat",
  protect,
  sendMessage
);

/*
============================================================
GET CONVERSATION
GET /api/career-copilot/:conversationId
============================================================
*/

router.get(
  "/:conversationId",
  protect,
  getConversation
);

/*
============================================================
DELETE CONVERSATION
DELETE /api/career-copilot/:conversationId
============================================================
*/

router.delete(
  "/:conversationId",
  protect,
  deleteConversation
);

module.exports = router;