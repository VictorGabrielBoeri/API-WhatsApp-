const mongoose = require("mongoose");

const metricSchema = new mongoose.Schema({
  instanceId: {
    type: String,
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  messagesSent: {
    type: Number,
    default: 0,
  },
  messagesFailed: {
    type: Number,
    default: 0,
  },
  avgResponseTime: Number,
  queueSize: Number,
});

module.exports = mongoose.model("Metric", metricSchema);
