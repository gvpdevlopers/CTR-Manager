const test = require("node:test");
const assert = require("node:assert/strict");
const QuoraAccount = require("../models/QuoraAccount");
const InstagramAccount = require("../models/InstagramAccount");
const quora = require("../controllers/quoraAccountController");
const instagram = require("../controllers/instagramAccountController");

function response() {
  return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

test("Quora saves the requested status, including suspicious", async (t) => {
  const account = { status: "working", async save() {} };
  t.mock.method(QuoraAccount, "findById", async () => account);
  const res = response();
  await quora.toggleQuoraStatus({ params: { id: "account" }, body: { status: "suspicious" } }, res);
  assert.equal(res.body.status, "suspicious");
});

test("Quora rejects invalid status and missing accounts", async (t) => {
  t.mock.method(QuoraAccount, "findById", async () => null);
  const invalid = response();
  await quora.toggleQuoraStatus({ params: { id: "account" }, body: { status: "invalid" } }, invalid);
  assert.equal(invalid.code, 400);
  const missing = response();
  await quora.toggleQuoraStatus({ params: { id: "account" }, body: { status: "working" } }, missing);
  assert.equal(missing.code, 404);
});

test("Instagram validates status and detects missing accounts", async (t) => {
  t.mock.method(InstagramAccount, "findByIdAndUpdate", async () => null);
  const invalid = response();
  await instagram.toggleInstagramStatus({ params: { id: "account" }, body: { status: "invalid" } }, invalid);
  assert.equal(invalid.code, 400);
  const missing = response();
  await instagram.toggleInstagramStatus({ params: { id: "account" }, body: { status: "working" } }, missing);
  assert.equal(missing.code, 404);
});
