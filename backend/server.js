const express = require("express");
const cors = require("cors");

const indexRoutes = require("./routes");
const robloxRoutes = require("./routes/roblox");

function createApp() {
  const app = express();

  app.use(cors());
  app.use("/", indexRoutes);
  app.use("/roblox", robloxRoutes);

  return app;
}

const app = createApp();

module.exports = app;
