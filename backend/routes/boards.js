const express = require("express");
const mongoose = require("mongoose");
const Board = require("../models/Board");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth);
const MAX_ACTIVITY_ENTRIES = 50;
const POPULATE_FIELDS = [
  { path: "owner", select: "name email" },
  { path: "members", select: "name email" },
  { path: "columns.cards.assignee", select: "name email" }
];

function sameId(a, b) { return a && b && a.toString() === b.toString(); }
function hasAccess(board, userId) {
  return sameId(board.owner?._id || board.owner, userId) || (board.members || []).some(m => sameId(m?._id || m, userId));
}
function isOwner(board, userId) { return sameId(board.owner?._id || board.owner, userId); }
function logActivity(board, type, message, actorName) {
  board.activity.push({ type, message, actorName: actorName || "Someone" });
  if (board.activity.length > MAX_ACTIVITY_ENTRIES) board.activity.splice(0, board.activity.length - MAX_ACTIVITY_ENTRIES);
}
async function saveAndEmit(req, board) {
  await board.save();
  await board.populate(POPULATE_FIELDS);
  const io = req.app.get("io");
  if (io) io.to(`board:${board._id}`).emit("board:update", board);
  return board;
}
async function getBoard(req, res) {
  const board = await Board.findById(req.params.id).populate(POPULATE_FIELDS);
  if (!board) { res.status(404).json({ message: "Board not found" }); return null; }
  if (!hasAccess(board, req.userId)) { res.status(403).json({ message: "You do not have access to this board" }); return null; }
  return board;
}

router.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Board name is required" });
    const board = await Board.create({
      name,
      owner: req.userId,
      members: [req.userId],
      columns: [
        { name: "To do", order: 0, cards: [] },
        { name: "In progress", order: 1, cards: [] },
        { name: "Review", order: 2, cards: [] },
        { name: "Done", order: 3, cards: [] }
      ],
      activity: [{ type: "board:create", message: `created the board "${name}"`, actorName: req.userName }]
    });
    await board.populate(POPULATE_FIELDS);
    res.status(201).json({ board });
  } catch (err) { res.status(500).json({ message: "Could not create board", error: err.message }); }
});

router.get("/", async (req, res) => {
  try {
    const boards = await Board.find({ $or: [{ owner: req.userId }, { members: req.userId }] })
      .select("name owner members updatedAt archived columns activity")
      .sort({ updatedAt: -1 });
    res.json({ boards });
  } catch (err) { res.status(500).json({ message: "Could not fetch boards", error: err.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const board = await getBoard(req, res);
    if (!board) return;
    res.json({ board });
  } catch (err) { res.status(500).json({ message: "Could not fetch board", error: err.message }); }
});

router.get("/:id/stats", async (req, res) => {
  try {
    const board = await getBoard(req, res);
    if (!board) return;
    const cards = board.columns.flatMap(c => c.cards);
    const doneColumnIds = new Set(board.columns.filter(c => /done|complete|completed/i.test(c.name)).map(c => c._id.toString()));
    const completed = board.columns.reduce((n, c) => n + (doneColumnIds.has(c._id.toString()) ? c.cards.length : 0), 0);
    const overdue = cards.filter(c => c.dueDate && new Date(c.dueDate) < new Date() && !doneColumnIds.has(board.columns.find(col => col.cards.id(c._id))?._id?.toString())).length;
    const high = cards.filter(c => c.priority === "high").length;
    res.json({ stats: { total: cards.length, completed, inProgress: Math.max(0, cards.length - completed), highPriority: high, overdue, progress: cards.length ? Math.round(completed / cards.length * 100) : 0, columns: board.columns.map(c => ({ id: c._id, name: c.name, count: c.cards.length })) } });
  } catch (err) { res.status(500).json({ message: "Could not calculate board stats", error: err.message }); }
});

router.patch("/:id", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });
    if (!hasAccess(board, req.userId)) return res.status(403).json({ message: "Access denied" });
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ message: "Board name cannot be empty" });
      board.name = name;
    }
    if (req.body.archived !== undefined) {
      if (!isOwner(board, req.userId)) return res.status(403).json({ message: "Only the owner can archive a board" });
      board.archived = !!req.body.archived;
    }
    logActivity(board, "board:update", "updated board settings", req.userName);
    const updated = await saveAndEmit(req, board);
    res.json({ board: updated });
  } catch (err) { res.status(500).json({ message: "Could not update board", error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });
    if (!isOwner(board, req.userId)) return res.status(403).json({ message: "Only the owner can delete this board" });
    await board.deleteOne();
    res.json({ message: "Board deleted" });
  } catch (err) { res.status(500).json({ message: "Could not delete board", error: err.message }); }
});

router.post("/:id/invite", async (req, res) => {
  try {
    const { email } = req.body;
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });
    if (!isOwner(board, req.userId)) return res.status(403).json({ message: "Only the board owner can invite members" });
    const user = await User.findOne({ email: String(email || "").toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "No account found with that email" });
    if (board.members.some(m => sameId(m, user._id))) return res.status(409).json({ message: "That user is already on this board" });
    board.members.push(user._id);
    logActivity(board, "member:invite", `invited ${user.name} to the board`, req.userName);
    res.json({ board: await saveAndEmit(req, board) });
  } catch (err) { res.status(500).json({ message: "Could not invite member", error: err.message }); }
});

router.delete("/:id/members/:memberId", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });
    if (!isOwner(board, req.userId)) return res.status(403).json({ message: "Only the owner can remove members" });
    if (sameId(board.owner, req.params.memberId)) return res.status(400).json({ message: "The owner cannot be removed" });
    board.members.pull(req.params.memberId);
    logActivity(board, "member:remove", "removed a member from the board", req.userName);
    res.json({ board: await saveAndEmit(req, board) });
  } catch (err) { res.status(500).json({ message: "Could not remove member", error: err.message }); }
});

router.post("/:id/leave", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });
    if (isOwner(board, req.userId)) return res.status(400).json({ message: "The owner cannot leave the board. Transfer ownership first." });
    board.members.pull(req.userId);
    logActivity(board, "member:leave", `${req.userName} left the board`, req.userName);
    await saveAndEmit(req, board);
    res.json({ message: "You left the board" });
  } catch (err) { res.status(500).json({ message: "Could not leave board", error: err.message }); }
});

router.post("/:id/columns", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Column name is required" });
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });
    if (!hasAccess(board, req.userId)) return res.status(403).json({ message: "Access denied" });
    board.columns.push({ name, order: board.columns.length, cards: [] });
    logActivity(board, "column:add", `added the column "${name}"`, req.userName);
    res.status(201).json({ board: await saveAndEmit(req, board) });
  } catch (err) { res.status(500).json({ message: "Could not add column", error: err.message }); }
});

router.patch("/:id/columns/:columnId", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Column name is required" });
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });
    if (!hasAccess(board, req.userId)) return res.status(403).json({ message: "Access denied" });
    const column = board.columns.id(req.params.columnId);
    if (!column) return res.status(404).json({ message: "Column not found" });
    column.name = name;
    logActivity(board, "column:rename", `renamed a column to "${name}"`, req.userName);
    res.json({ board: await saveAndEmit(req, board) });
  } catch (err) { res.status(500).json({ message: "Could not update column", error: err.message }); }
});

router.delete("/:id/columns/:columnId", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });
    if (!hasAccess(board, req.userId)) return res.status(403).json({ message: "Access denied" });
    if (board.columns.length <= 1) return res.status(400).json({ message: "A board must keep at least one column" });
    const column = board.columns.id(req.params.columnId);
    if (!column) return res.status(404).json({ message: "Column not found" });
    const name = column.name;
    board.columns.pull(column._id);
    board.columns.forEach((c, i) => c.order = i);
    logActivity(board, "column:delete", `deleted the column "${name}"`, req.userName);
    res.json({ board: await saveAndEmit(req, board) });
  } catch (err) { res.status(500).json({ message: "Could not delete column", error: err.message }); }
});

router.post("/:id/columns/:columnId/cards", async (req, res) => {
  try {
    const { title, description, tag, priority, dueDate, assignee, checklist } = req.body;
    if (!String(title || "").trim()) return res.status(400).json({ message: "Card title is required" });
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });
    if (!hasAccess(board, req.userId)) return res.status(403).json({ message: "Access denied" });
    const column = board.columns.id(req.params.columnId);
    if (!column) return res.status(404).json({ message: "Column not found" });
    column.cards.push({
      title: String(title).trim(), description: String(description || ""), tag: String(tag || "").trim(),
      order: column.cards.length, priority: priority || "medium", dueDate: dueDate || null,
      assignee: assignee || null, checklist: Array.isArray(checklist) ? checklist : []
    });
    logActivity(board, "card:add", `added "${title}" to ${column.name}`, req.userName);
    res.status(201).json({ board: await saveAndEmit(req, board) });
  } catch (err) { res.status(500).json({ message: "Could not add card", error: err.message }); }
});

router.patch("/:id/cards/:cardId", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });
    if (!hasAccess(board, req.userId)) return res.status(403).json({ message: "Access denied" });
    let card = null;
    for (const column of board.columns) { const found = column.cards.id(req.params.cardId); if (found) { card = found; break; } }
    if (!card) return res.status(404).json({ message: "Card not found" });
    const fields = ["title", "description", "tag", "priority", "dueDate", "assignee", "checklist"];
    for (const field of fields) if (req.body[field] !== undefined) card[field] = req.body[field] === "" && ["dueDate", "assignee"].includes(field) ? null : req.body[field];
    if (Array.isArray(card.checklist)) card.checklist = card.checklist.map(x => ({ text: String(x.text || "").trim(), done: !!x.done })).filter(x => x.text);
    logActivity(board, "card:update", `updated "${card.title}"`, req.userName);
    res.json({ board: await saveAndEmit(req, board) });
  } catch (err) { res.status(500).json({ message: "Could not update card", error: err.message }); }
});

router.patch("/:id/cards/:cardId/move", async (req, res) => {
  try {
    const { toColumnId, toIndex } = req.body;
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });
    if (!hasAccess(board, req.userId)) return res.status(403).json({ message: "Access denied" });
    let card = null, fromColumn = null;
    for (const column of board.columns) { const found = column.cards.id(req.params.cardId); if (found) { card = found; fromColumn = column; break; } }
    if (!card) return res.status(404).json({ message: "Card not found" });
    const toColumn = board.columns.id(toColumnId);
    if (!toColumn) return res.status(404).json({ message: "Target column not found" });
    const cardData = card.toObject(); const title = card.title;
    const same = sameId(fromColumn._id, toColumn._id);
    fromColumn.cards.pull(card._id);
    const insertAt = Math.max(0, Math.min(Number(toIndex) || 0, toColumn.cards.length));
    toColumn.cards.splice(insertAt, 0, cardData);
    board.columns.forEach(c => c.cards.forEach((x, i) => x.order = i));
    if (!same) logActivity(board, "card:move", `moved "${title}" to ${toColumn.name}`, req.userName);
    res.json({ board: await saveAndEmit(req, board) });
  } catch (err) { res.status(500).json({ message: "Could not move card", error: err.message }); }
});

router.delete("/:id/cards/:cardId", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });
    if (!hasAccess(board, req.userId)) return res.status(403).json({ message: "Access denied" });
    let deletedTitle = null;
    for (const column of board.columns) { const found = column.cards.id(req.params.cardId); if (found) { deletedTitle = found.title; column.cards.pull(found._id); break; } }
    if (deletedTitle === null) return res.status(404).json({ message: "Card not found" });
    board.columns.forEach(c => c.cards.forEach((x, i) => x.order = i));
    logActivity(board, "card:delete", `deleted "${deletedTitle}"`, req.userName);
    res.json({ board: await saveAndEmit(req, board) });
  } catch (err) { res.status(500).json({ message: "Could not delete card", error: err.message }); }
});

module.exports = router;
