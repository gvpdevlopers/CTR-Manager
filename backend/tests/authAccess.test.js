const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middlewares/authMiddleware");

test("a disabled user cannot use an existing valid token", async t => {
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret";
  t.after(() => { if (previous === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previous; });
  t.mock.method(User, "findById", () => ({ select: async () => ({ isActive: false }) }));
  const token = jwt.sign({ id: "user" }, process.env.JWT_SECRET);
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  let nextCalled = false;
  await protect({ headers: { authorization: `Bearer ${token}` } }, res, () => { nextCalled = true; });
  assert.equal(res.code, 401);
  assert.equal(nextCalled, false);
});

test("password reset revokes previously issued tokens", async t => {
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret";
  t.after(() => { if (previous === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previous; });
  t.mock.method(User, "findById", () => ({ select: async () => ({ isActive: true, tokenVersion: 1 }) }));
  const token = jwt.sign({ id: "user", tokenVersion: 0 }, process.env.JWT_SECRET);
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  let nextCalled = false;
  await protect({ headers: { authorization: `Bearer ${token}` } }, res, () => { nextCalled = true; });
  assert.equal(res.code, 401);
  assert.equal(nextCalled, false);
});
