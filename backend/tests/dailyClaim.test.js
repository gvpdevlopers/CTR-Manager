const test = require("node:test");
const assert = require("node:assert/strict");
const InstagramAccount = require("../models/InstagramAccount");
const TaskExecution = require("../models/TaskExecution");
const { markSharedClaim } = require("../services/dailyClaim.service");
const accountId = "507f1f77bcf86cd799439011";

test("simultaneous employees converge on one account/day claim", async (t) => {
  const stored = new Map();
  t.mock.method(InstagramAccount, "exists", async () => true);
  t.mock.method(TaskExecution, "findOne", () => ({ sort: async () => null }));
  t.mock.method(TaskExecution, "findOneAndUpdate", async (query, update) => {
    const key = String(query._id);
    if (!stored.has(key)) stored.set(key, { ...update.$setOnInsert, _id: query._id });
    return stored.get(key);
  });
  const [first, second] = await Promise.all([
    markSharedClaim({ accountId, platform: "instagram", employeeId: "employee-a" }),
    markSharedClaim({ accountId, platform: "instagram", employeeId: "employee-b" }),
  ]);
  assert.equal(stored.size, 1);
  assert.equal(String(first._id), String(second._id));
  assert.equal(first.employeeId, second.employeeId);
});

test("existing claim retains its original employee", async (t) => {
  t.mock.method(InstagramAccount, "exists", async () => true);
  const existing = { employeeId: "first-employee" };
  t.mock.method(TaskExecution, "findOne", () => ({ sort: async () => existing }));
  const result = await markSharedClaim({ accountId, platform: "instagram", employeeId: "second-employee" });
  assert.equal(result.employeeId, "first-employee");
});

test("invalid input is rejected", async () => {
  await assert.rejects(markSharedClaim({ accountId: "invalid", platform: "instagram", employeeId: "employee" }), { status: 400 });
});
