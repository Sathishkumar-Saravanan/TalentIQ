require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`TalentIQ server running on port ${PORT}`);
      console.log(`API: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("SERVER STARTUP ERROR:", error.message);
    process.exit(1);
  }
};

startServer();