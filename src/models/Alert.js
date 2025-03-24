const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  instanceId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
  },
  message: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Alert", alertSchema);
