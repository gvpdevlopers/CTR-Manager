const test = require("node:test");
const assert = require("node:assert/strict");
const QuoraAccount = require("../models/QuoraAccount");
const controller = require("../controllers/quoraAccountController");
function response() { return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }

test("rejects non-Quora and non-HTTPS profile URLs", async () => {
  for (const profileUrl of ["https://evil.example/profile/person", "http://quora.com/profile/person", "https://quora.com.evil.example/profile/person"]) {
    const res = response();
    await controller.updateQuoraAccount({ params: { id: "account" }, body: { profileUrl } }, res);
    assert.equal(res.code, 400);
  }
});

test("does not replace a profile associated with a captured baseline", async (t) => {
  t.mock.method(QuoraAccount, "findById", async () => ({ profileUrl: "https://www.quora.com/profile/Original", baselineCapturedAt: new Date() }));
  const res = response();
  await controller.updateQuoraAccount({ params: { id: "account" }, body: { profileUrl: "https://www.quora.com/profile/Other" } }, res);
  assert.equal(res.code, 409);
});
test("changing a profile with confirmation clears the old baseline", async (t) => {
  t.mock.method(QuoraAccount, "findById", async () => ({ profileUrl: "https://www.quora.com/profile/Original", baselineCapturedAt: new Date() }));
  let saved;
  t.mock.method(QuoraAccount, "findByIdAndUpdate", async (id, update) => { saved = update; return update; });
  const res = response();
  await controller.updateQuoraAccount({ params: { id: "account" }, body: { profileUrl: "https://www.quora.com/profile/Other", resetBaseline: true } }, res);
  assert.equal(res.code, 200);
  assert.equal(saved.baselineCapturedAt, null);
  assert.equal(saved.baselineAnswers, null);
  assert.equal(saved.profileUrl, "https://www.quora.com/profile/Other");
});
