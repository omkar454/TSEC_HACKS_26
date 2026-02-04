import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { config } from "./src/config/env.js";

// Connect to Database
connectDB();

// Start Server
const PORT = config.port || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${config.env} mode on port ${PORT}`);
});
