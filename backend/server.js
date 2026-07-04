const express = require("express");
const path = require("path");
const cors = require("cors");

const { initializeDatabase } = require("./database/db");
const indexRoutes = require("./routes");
const robloxRoutes = require("./routes/roblox");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
  });
  app.use("/dashboard", express.static(path.join(__dirname, "..", "frontend")));
  app.use("/", indexRoutes);
  app.use("/roblox", robloxRoutes);

  return app;
}

const app = createApp();

initializeDatabase().catch((err) => {
  console.error("Database initialization failed:", err.message);
});

module.exports = app;
