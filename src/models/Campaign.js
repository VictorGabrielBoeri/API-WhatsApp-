const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  variables: {
    type: Map,
    of: String,
  },
  status: {
    type: String,
    enum: ["pending", "sent", "failed"],
    default: "pending",
  },
  error: String,
  sentAt: Date,
  attempts: {
    type: Number,
    default: 0,
  },
});

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  messageTemplate: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["draft", "in_progress", "completed", "failed", "paused"],
    default: "draft",
  },
  messages: [messageSchema],
  startedAt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  statistics: {
    totalMessages: Number,
    successfulMessages: Number,
    failedMessages: Number,
    successRate: Number,
  },
});

module.exports = mongoose.model("Campaign", campaignSchema);
