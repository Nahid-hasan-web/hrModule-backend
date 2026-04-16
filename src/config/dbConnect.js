const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "hrModule",
      autoIndex: false,
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDB Connected Host:", conn.connection.host);
    console.log("MongoDB Connected DB:", conn.connection.name);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = dbConnect;
