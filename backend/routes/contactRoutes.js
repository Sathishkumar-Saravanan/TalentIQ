const express = require("express");

const {
  submitContact,
  getContacts,
  getContactById,
  updateContactStatus,
} = require("../controllers/contactController");

const router = express.Router();


// ======================================================
// POST /api/contact
// ======================================================
router.post("/", submitContact);


// ======================================================
// GET /api/contact
// ======================================================
router.get("/", getContacts);


// ======================================================
// GET /api/contact/:id
// ======================================================
router.get("/:id", getContactById);


// ======================================================
// PATCH /api/contact/:id/status
// ======================================================
router.patch("/:id/status", updateContactStatus);


module.exports = router;