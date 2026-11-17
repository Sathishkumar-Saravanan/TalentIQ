const Contact = require("../models/contact");

// ======================================================
// POST /api/contact
// Submit contact message
// ======================================================
const submitContact = async (req, res) => {
  try {
    console.log("======================================");
    console.log("CONTACT REQUEST RECEIVED");
    console.log("Body:", req.body);
    console.log("======================================");

    const { fullName, email, subject, message } = req.body;

    // Validation
    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, subject and message are required",
      });
    }

    // Create contact message
    const contact = await Contact.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    });

    console.log("Contact message saved successfully:");
    console.log(contact);

    return res.status(201).json({
      success: true,
      message: "Your message has been sent successfully!",
      contact: {
        id: contact._id,
        fullName: contact.fullName,
        email: contact.email,
        subject: contact.subject,
        message: contact.message,
        status: contact.status,
        createdAt: contact.createdAt,
      },
    });
  } catch (error) {
    console.error("CONTACT CONTROLLER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send your message",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};


// ======================================================
// GET /api/contact
// Get all contact messages
// ======================================================
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    console.error("GET CONTACTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact messages",
    });
  }
};


// ======================================================
// GET /api/contact/:id
// Get one contact message
// ======================================================
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    return res.status(200).json({
      success: true,
      contact,
    });
  } catch (error) {
    console.error("GET CONTACT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact message",
    });
  }
};


// ======================================================
// PATCH /api/contact/:id/status
// Update contact status
// ======================================================
const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["new", "read", "replied"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact status updated successfully",
      contact,
    });
  } catch (error) {
    console.error("UPDATE CONTACT STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update contact status",
    });
  }
};


module.exports = {
  submitContact,
  getContacts,
  getContactById,
  updateContactStatus,
};