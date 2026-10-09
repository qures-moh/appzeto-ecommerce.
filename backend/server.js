require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const backgroundQueue = require("./services/backgroundJobs");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  // Start background job workers (inventory expiry release, abandoned carts)
  backgroundQueue.startPeriodicWorkers(60000);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});