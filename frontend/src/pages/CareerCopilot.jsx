import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FaPlus,
  FaRobot,
  FaUser,
  FaPaperPlane,
  FaTrash,
  FaBars,
  FaTimes,
  FaArrowLeft,
} from "react-icons/fa";

import { Link } from "react-router-dom";

import "../styles/CareerCopilot.css";

function CareerCopilot() {
  const API_URL = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
  ).replace(/\/$/, "");

  const [conversations, setConversations] =
    useState([]);

  const [activeConversationId, setActiveConversationId] =
    useState(null);

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const messagesEndRef = useRef(null);

  /*
  ==========================================================
  TOKEN
  ==========================================================
  */

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("talentIQToken") ||
      localStorage.getItem("authToken")
    );
  };

  /*
  ==========================================================
  SCROLL
  ==========================================================
  */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);

  /*
  ==========================================================
  LOAD HISTORY
  ==========================================================
  */

  const loadHistory = async () => {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_URL}/api/career-copilot/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to load conversation history"
        );
      }

      setConversations(
        result.conversations || []
      );
    } catch (error) {
      console.error(
        "Career Copilot History Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  /*
  ==========================================================
  LOAD CONVERSATION
  ==========================================================
  */

  const openConversation = async (
    conversationId
  ) => {
    try {
      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/career-copilot/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to load conversation"
        );
      }

      setActiveConversationId(
        conversationId
      );

      setMessages(
        result.conversation?.messages || []
      );

      if (
        window.innerWidth < 900
      ) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error(
        "Open Conversation Error:",
        error
      );
    }
  };

  /*
  ==========================================================
  NEW CHAT
  ==========================================================
  */

  const createNewChat = () => {
    setActiveConversationId(null);

    setMessages([]);

    setInput("");

    if (
      window.innerWidth < 900
    ) {
      setSidebarOpen(false);
    }
  };

  /*
  ==========================================================
  SEND MESSAGE
  ==========================================================
  */

  const sendMessage = async () => {
    const message = input.trim();

    if (!message || sending) {
      return;
    }

    const token = getToken();

    if (!token) {
      return;
    }

    const temporaryMessage = {
      role: "user",
      content: message,
    };

    setMessages((previous) => [
      ...previous,
      temporaryMessage,
    ]);

    setInput("");

    setSending(true);

    try {
      const response = await fetch(
        `${API_URL}/api/career-copilot/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            conversationId:
              activeConversationId,
            message,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to send message"
        );
      }

      /*
      ======================================================
      UPDATE CONVERSATION
      ======================================================
      */

      setActiveConversationId(
        result.conversationId
      );

      setMessages(
        result.conversation?.messages ||
          [
            ...messages,
            {
              role: "assistant",
              content: result.message,
            },
          ]
      );

      await loadHistory();
    } catch (error) {
      console.error(
        "Career Copilot Error:",
        error
      );

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't process your request right now. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  /*
  ==========================================================
  ENTER KEY
  ==========================================================
  */

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  /*
  ==========================================================
  DELETE CONVERSATION
  ==========================================================
  */

  const deleteConversation = async (
    event,
    conversationId
  ) => {
    event.stopPropagation();

    const confirmed =
      window.confirm(
        "Delete this conversation?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/career-copilot/${conversationId}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to delete conversation"
        );
      }

      setConversations(
        (previous) =>
          previous.filter(
            (conversation) =>
              conversation._id !==
              conversationId
          )
      );

      if (
        activeConversationId ===
        conversationId
      ) {
        createNewChat();
      }
    } catch (error) {
      console.error(
        "Delete Conversation Error:",
        error
      );
    }
  };

  /*
  ==========================================================
  FORMAT DATE
  ==========================================================
  */

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    const conversationDate =
      new Date(date);

    const now = new Date();

    const difference =
      now.getTime() -
      conversationDate.getTime();

    const oneDay =
      24 * 60 * 60 * 1000;

    if (difference < oneDay) {
      return "Today";
    }

    if (
      difference <
      2 * oneDay
    ) {
      return "Yesterday";
    }

    return conversationDate.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
      }
    );
  };

  /*
  ==========================================================
  UI
  ==========================================================
  */

  return (
    <div className="career-copilot-page">

      {/* SIDEBAR */}

      <aside
        className={`career-copilot-sidebar ${
          sidebarOpen
            ? "open"
            : "closed"
        }`}
      >

        <div className="copilot-sidebar-header">

          <div className="copilot-brand">
            <div className="copilot-brand-icon">
              <FaRobot />
            </div>

            <div>
              <strong>
                Career Copilot
              </strong>

              <span>
                TalentIQ AI
              </span>
            </div>
          </div>

          <button
            className="copilot-mobile-close"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <FaTimes />
          </button>

        </div>

        {/* NEW CHAT */}

        <button
          className="copilot-new-chat"
          onClick={createNewChat}
        >
          <FaPlus />
          <span>
            New conversation
          </span>
        </button>

        {/* HISTORY */}

        <div className="copilot-history">

          <div className="copilot-history-title">
            Conversation History
          </div>

          {loading ? (
            <div className="copilot-history-loading">
              Loading history...
            </div>
          ) : conversations.length ===
            0 ? (
            <div className="copilot-history-empty">
              <FaRobot />

              <p>
                No conversations yet.
              </p>

              <span>
                Start a conversation with
                Career Copilot.
              </span>
            </div>
          ) : (
            <div className="copilot-history-list">

              {conversations.map(
                (conversation) => (
                  <button
                    key={
                      conversation._id
                    }
                    className={`copilot-history-item ${
                      activeConversationId ===
                      conversation._id
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      openConversation(
                        conversation._id
                      )
                    }
                  >

                    <div className="history-item-main">

                      <FaRobot />

                      <div>
                        <strong>
                          {
                            conversation.title
                          }
                        </strong>

                        <span>
                          {formatDate(
                            conversation.updatedAt
                          )}
                        </span>
                      </div>

                    </div>

                    <span
                      className="history-delete"
                      onClick={(event) =>
                        deleteConversation(
                          event,
                          conversation._id
                        )
                      }
                    >
                      <FaTrash />
                    </span>

                  </button>
                )
              )}

            </div>
          )}

        </div>

        {/* SIDEBAR FOOTER */}

        <div className="copilot-sidebar-footer">

          <Link to="/">
            <FaArrowLeft />
            Back to Home
          </Link>

        </div>

      </aside>

      {/* MAIN */}

      <main className="career-copilot-main">

        {/* HEADER */}

        <header className="copilot-main-header">

          <button
            className="copilot-menu-button"
            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }
          >
            <FaBars />
          </button>

          <div>
            <h1>
              Career Copilot
            </h1>

            <span>
              Your AI career assistant
            </span>
          </div>

        </header>

        {/* CHAT */}

        <div className="copilot-chat-area">

          {messages.length === 0 ? (
            <div className="copilot-welcome">

              <div className="copilot-welcome-icon">
                <FaRobot />
              </div>

              <h2>
                How can I help with your
                career?
              </h2>

              <p>
                Ask Career Copilot about jobs,
                resumes, skills, interviews,
                career paths or applications.
              </p>

              <div className="copilot-suggestions">

                <button
                  onClick={() =>
                    setInput(
                      "How can I improve my career readiness?"
                    )
                  }
                >
                  How can I improve my career
                  readiness?
                </button>

                <button
                  onClick={() =>
                    setInput(
                      "What skills should I learn for my target role?"
                    )
                  }
                >
                  What skills should I learn?
                </button>

                <button
                  onClick={() =>
                    setInput(
                      "How should I prepare for interviews?"
                    )
                  }
                >
                  Help me prepare for interviews
                </button>

                <button
                  onClick={() =>
                    setInput(
                      "How can I improve my resume?"
                    )
                  }
                >
                  How can I improve my resume?
                </button>

              </div>

            </div>
          ) : (
            <div className="copilot-messages">

              {messages.map(
                (message, index) => (
                  <div
                    key={index}
                    className={`copilot-message ${
                      message.role
                    }`}
                  >

                    <div className="copilot-avatar">

                      {message.role ===
                      "assistant" ? (
                        <FaRobot />
                      ) : (
                        <FaUser />
                      )}

                    </div>

                    <div className="copilot-message-content">

                      <span className="copilot-message-role">
                        {message.role ===
                        "assistant"
                          ? "Career Copilot"
                          : "You"}
                      </span>

                      <p>
                        {message.content}
                      </p>

                    </div>

                  </div>
                )
              )}

              {sending && (
                <div className="copilot-message assistant">

                  <div className="copilot-avatar">
                    <FaRobot />
                  </div>

                  <div className="copilot-message-content">

                    <span className="copilot-message-role">
                      Career Copilot
                    </span>

                    <div className="copilot-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>

                  </div>

                </div>
              )}

              <div
                ref={messagesEndRef}
              />

            </div>
          )}

        </div>

        {/* INPUT */}

        <div className="copilot-input-wrapper">

          <div className="copilot-input-box">

            <textarea
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask Career Copilot anything about your career..."
              rows="1"
              disabled={sending}
            />

            <button
              onClick={sendMessage}
              disabled={
                !input.trim() ||
                sending
              }
            >
              <FaPaperPlane />
            </button>

          </div>

          <p className="copilot-input-note">
            Career Copilot provides AI-assisted
            career guidance. Always verify
            important information.
          </p>

        </div>

      </main>

    </div>
  );
}

export default CareerCopilot;