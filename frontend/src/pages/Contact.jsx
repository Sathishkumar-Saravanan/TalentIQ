import React, { useState } from "react";
import {
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

import "../styles/Contact.css";


const Contact = () => {
  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";


  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });


  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");


  // ======================================================
  // HANDLE INPUT
  // ======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };


  // ======================================================
  // SUBMIT CONTACT FORM
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    console.log("======================================");
    console.log("Sending contact request...");
    console.log("API URL:", `${API_URL}/api/contact`);
    console.log("Form Data:", formData);
    console.log("======================================");


    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          subject: formData.subject,
          message: formData.message.trim(),
        }),
      });


      console.log("Contact HTTP Status:", response.status);


      let data;

      try {
        data = await response.json();
      } catch {
        data = {
          success: false,
          message: "Invalid response from server",
        };
      }


      console.log("Contact API Response:", data);


      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            `Request failed with status ${response.status}`
        );
      }


      // SUCCESS
      setSuccess(
        data.message || "Your message has been sent successfully!"
      );


      // Clear form
      setFormData({
        fullName: "",
        email: "",
        subject: "General Inquiry",
        message: "",
      });


    } catch (err) {
      console.error("Contact Error:", err);

      setError(
        err.message ||
          "Unable to send your message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="contact-page">

      <div className="contact-container">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="contact-header">

          <div className="contact-icon">
            <FaPaperPlane />
          </div>


          <div className="contact-heading">

            <span className="contact-label">
              SEND A MESSAGE
            </span>

            <h1>
              Contact TalentIQ
            </h1>

            <p>
              Have a question, feedback, or need help?
              Send us a message and our team will get back
              to you.
            </p>

          </div>

        </div>


        {/* ==================================================
            SUCCESS MESSAGE
        ================================================== */}

        {success && (
          <div className="contact-success">

            <FaCheckCircle />

            <span>
              {success}
            </span>

          </div>
        )}


        {/* ==================================================
            ERROR MESSAGE
        ================================================== */}

        {error && (
          <div className="contact-error">

            <FaExclamationCircle />

            <span>
              {error}
            </span>

          </div>
        )}


        {/* ==================================================
            CONTACT FORM
        ================================================== */}

        <form
          className="contact-form"
          onSubmit={handleSubmit}
        >

          {/* FULL NAME */}

          <div className="contact-field">

            <label htmlFor="fullName">
              Full Name
            </label>

            <input
              id="fullName"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              maxLength={100}
              required
              disabled={loading}
            />

          </div>


          {/* EMAIL */}

          <div className="contact-field">

            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
              disabled={loading}
            />

          </div>


          {/* SUBJECT */}

          <div className="contact-field">

            <label htmlFor="subject">
              Subject
            </label>

            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              disabled={loading}
              required
            >

              <option value="General Inquiry">
                General Inquiry
              </option>

              <option value="Account & Login">
                Account & Login
              </option>

              <option value="Job Search">
                Job Search
              </option>

              <option value="Resume & AI">
                Resume & AI
              </option>

              <option value="Applications">
                Applications
              </option>

              <option value="Feedback">
                Feedback
              </option>

              <option value="Technical Issue">
                Technical Issue
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </div>


          {/* MESSAGE */}

          <div className="contact-field">

            <div className="message-label-row">

              <label htmlFor="message">
                Message
              </label>

              <span className="character-count">
                {formData.message.length}/2000
              </span>

            </div>


            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Write your message here..."
              maxLength={2000}
              rows={7}
              required
              disabled={loading}
            />

          </div>


          {/* SUBMIT BUTTON */}

          <button
            type="submit"
            className="contact-submit"
            disabled={loading}
          >

            {loading ? (
              <>
                <span className="contact-spinner"></span>
                Sending...
              </>
            ) : (
              <>
                Send Message
                <FaPaperPlane />
              </>
            )}

          </button>

        </form>

      </div>

    </div>
  );
};


export default Contact;