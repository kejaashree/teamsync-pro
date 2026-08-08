const mongoose = require("mongoose");

const PRIORITIES = ["low", "medium", "high"];

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  done: { type: Boolean, default: false }
}, { _id: true });

const cardSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  tag: { type: String, default: "" },
  order: { type: Number, default: 0 },
  priority: { type: String, enum: PRIORITIES, default: "medium" },
  dueDate: { type: Date, default: null },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  checklist: { type: [checklistItemSchema], default: [] }
}, { timestamps: true });

const columnSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  cards: { type: [cardSchema], default: [] }
});

const activitySchema = new mongoose.Schema({
  type: { type: String, required: true },
  message: { type: String, required: true },
  actorName: { type: String, default: "Someone" }
}, { timestamps: true });

const boardSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  columns: { type: [columnSchema], default: [] },
  activity: { type: [activitySchema], default: [] },
  archived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Board", boardSchema);
module.exports.PRIORITIES = PRIORITIES;
