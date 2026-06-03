const mongoose = require("mongoose");

const connect = async () => {
  const uri = process.env.MONGO_URI || "mongodb://mongo:27017/cryptosentiment";
  try {
    await mongoose.connect(uri);
    console.log(`✅ MongoDB → ${uri}`);
  } catch (err) {
    console.warn(`⚠️  MongoDB unavailable (${err.message}) — history features disabled`);
  }
};

module.exports = { connect };
