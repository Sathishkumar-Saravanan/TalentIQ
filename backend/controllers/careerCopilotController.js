const CareerCopilotConversation = require("../models/CareerCopilotConversation");
const User = require("../models/User");

/*
============================================================
CREATE CAREER COPILOT RESPONSE
============================================================
*/

const generateCareerResponse = async (message, user) => {
  const text = message.toLowerCase();

  const name =
    user.fullName ||
    user.name ||
    user.username ||
    "there";

  const skills = Array.isArray(user.skills)
    ? user.skills
    : [];

  const targetRole =
    user.careerPreferences?.targetRole ||
    "";

  const location =
    user.careerPreferences?.preferredLocation ||
    user.location ||
    "";

  const experience =
    user.experience?.years ||
    0;

  /*
  ==========================================================
  JOB SEARCH
  ==========================================================
  */

  if (
    text.includes("job") ||
    text.includes("jobs") ||
    text.includes("job search") ||
    text.includes("find jobs")
  ) {
    return `Hi ${name}! Based on your current profile${
      targetRole
        ? ` and target role of ${targetRole}`
        : ""
    }, I recommend focusing on jobs that closely match your existing skills.

Your current skills include ${
      skills.length > 0
        ? skills.join(", ")
        : "no skills added yet"
    }.

You can use TalentIQ's Find Jobs and AI Job Search features to discover relevant opportunities${
      location
        ? ` in ${location}`
        : ""
    }.

Tip: Keep your resume and skills updated before applying.`;
  }

  /*
  ==========================================================
  RESUME
  ==========================================================
  */

  if (
    text.includes("resume") ||
    text.includes("cv")
  ) {
    return `Your resume is one of the most important parts of your job search.

For your profile, I recommend:

1. Keep your target role clearly visible.
2. Highlight your strongest technical skills.
3. Add measurable project achievements.
4. Keep the resume concise and ATS-friendly.
5. Customize important sections for each job.

Since you are using TalentIQ, you can also use the Resume and AI features to improve your resume before applying.`;
  }

  /*
  ==========================================================
  SKILLS
  ==========================================================
  */

  if (
    text.includes("skill") ||
    text.includes("learn") ||
    text.includes("improve")
  ) {
    if (skills.length === 0) {
      return `I recommend adding your current technical skills to your TalentIQ profile first.

Once your skills are available, TalentIQ can identify skill gaps and recommend areas to improve.

For a software development career, focus on:
• Programming fundamentals
• Data structures and algorithms
• Git and GitHub
• REST APIs
• Databases
• Projects
• Interview preparation`;
    }

    return `You currently have ${
      skills.length
    } skill${
      skills.length === 1 ? "" : "s"
    } listed:

${skills.join(", ")}

To improve your career readiness, focus on strengthening the skills most relevant to${
      targetRole
        ? ` ${targetRole}`
        : " your target role"
    }.

I recommend choosing 1–2 skills at a time and building practical projects around them rather than trying to learn everything simultaneously.`;
  }

  /*
  ==========================================================
  INTERVIEW
  ==========================================================
  */

  if (
    text.includes("interview") ||
    text.includes("interview preparation") ||
    text.includes("prepare")
  ) {
    return `For interview preparation, use this approach:

1. Revise your core programming concepts.
2. Practice common coding problems.
3. Understand your projects deeply.
4. Prepare a strong self-introduction.
5. Practice explaining technical decisions.
6. Prepare questions about the company and role.

For ${
      targetRole || "your target software role"
    }, project-based questions are especially important.

Be ready to explain what you built, why you built it, the technologies you used, problems you faced, and how you solved them.`;
  }

  /*
  ==========================================================
  CAREER
  ==========================================================
  */

  if (
    text.includes("career") ||
    text.includes("career path") ||
    text.includes("future")
  ) {
    return `Your career direction should be based on your target role, existing skills, experience and interests.

${
  targetRole
    ? `Your current target role is ${targetRole}.`
    : "You have not set a target role yet."
}

${
  experience
    ? `You currently have approximately ${experience} years of experience.`
    : "Your profile currently indicates an entry-level experience level."
}

My recommendation is to choose a specific target role, identify the most important skills for that role, build projects demonstrating those skills, and then apply consistently to relevant positions.`;
  }

  /*
  ==========================================================
  SALARY
  ==========================================================
  */

  if (
    text.includes("salary") ||
    text.includes("package") ||
    text.includes("ctc")
  ) {
    return `Salary expectations depend on the role, company, location, experience and technical skills.

Instead of focusing only on salary, I recommend comparing:

• Role responsibilities
• Technology stack
• Learning opportunities
• Career growth
• Company stability
• Location
• Benefits

Once you have stronger projects, relevant skills and interview preparation, your ability to target better-paying roles will improve.`;
  }

  /*
  ==========================================================
  GREETING
  ==========================================================
  */

  if (
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey")
  ) {
    return `Hello ${name}! 👋

I'm your TalentIQ Career Copilot.

I can help you with:

• Career planning
• Job search strategy
• Resume improvement
• Skill development
• Interview preparation
• Career paths
• Job applications
• Salary discussions

What would you like help with today?`;
  }

  /*
  ==========================================================
  DEFAULT RESPONSE
  ==========================================================
  */

  return `I can help you with that, ${name}.

As your TalentIQ Career Copilot, I can help you with:

• Finding suitable jobs
• Improving your resume
• Identifying skill gaps
• Planning your career
• Interview preparation
• Learning recommendations
• Job application strategy
• Understanding career opportunities

${
  targetRole
    ? `Your current target role is ${targetRole}, so I can also tailor recommendations around that career direction.`
    : "Set a target role in your profile so I can provide more personalized recommendations."
  }

Tell me what you would like to work on.`;
};

/*
============================================================
GET CONVERSATION HISTORY
GET /api/career-copilot/history
============================================================
*/

const getConversationHistory = async (req, res) => {
  try {
    const conversations =
      await CareerCopilotConversation.find({
        user: req.user._id,
      })
        .select("_id title lastMessage updatedAt createdAt")
        .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error(
      "GET COPILOT HISTORY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load conversation history",
    });
  }
};

/*
============================================================
GET SINGLE CONVERSATION
GET /api/career-copilot/:conversationId
============================================================
*/

const getConversation = async (req, res) => {
  try {
    const conversation =
      await CareerCopilotConversation.findOne({
        _id: req.params.conversationId,
        user: req.user._id,
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error(
      "GET COPILOT CONVERSATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load conversation",
    });
  }
};

/*
============================================================
SEND MESSAGE
POST /api/career-copilot/chat
============================================================
*/

const sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const user = await User.findById(req.user._id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let conversation;

    /*
    ========================================================
    EXISTING CONVERSATION
    ========================================================
    */

    if (conversationId) {
      conversation =
        await CareerCopilotConversation.findOne({
          _id: conversationId,
          user: req.user._id,
        });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }
    }

    /*
    ========================================================
    NEW CONVERSATION
    ========================================================
    */

    if (!conversation) {
      const title =
        message.trim().length > 45
          ? `${message.trim().substring(0, 45)}...`
          : message.trim();

      conversation =
        await CareerCopilotConversation.create({
          user: req.user._id,
          title,
          messages: [],
          lastMessage: "",
        });
    }

    /*
    ========================================================
    USER MESSAGE
    ========================================================
    */

    conversation.messages.push({
      role: "user",
      content: message.trim(),
    });

    /*
    ========================================================
    AI RESPONSE
    ========================================================
    */

    const assistantResponse =
      await generateCareerResponse(
        message.trim(),
        user
      );

    conversation.messages.push({
      role: "assistant",
      content: assistantResponse,
    });

    conversation.lastMessage =
      message.trim();

    await conversation.save();

    return res.status(200).json({
      success: true,
      conversationId: conversation._id,
      message: assistantResponse,
      conversation,
    });
  } catch (error) {
    console.error(
      "CAREER COPILOT CHAT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to process Career Copilot request",
      error: error.message,
    });
  }
};

/*
============================================================
DELETE CONVERSATION
DELETE /api/career-copilot/:conversationId
============================================================
*/

const deleteConversation = async (req, res) => {
  try {
    const conversation =
      await CareerCopilotConversation.findOneAndDelete({
        _id: req.params.conversationId,
        user: req.user._id,
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE COPILOT CONVERSATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to delete conversation",
    });
  }
};

module.exports = {
  getConversationHistory,
  getConversation,
  sendMessage,
  deleteConversation,
};