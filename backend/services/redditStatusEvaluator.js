exports.evaluateStatus = ({
  u1,
  u2,
  expectedComments = 1,
  expectedPosts = 0,
}) => {
  const u1Done = u1.comments >= expectedComments || u1.posts >= expectedPosts;
  const u2Done = u2.comments >= expectedComments || u2.posts >= expectedPosts;

  if (u1Done && u2Done) return "done";

  if (u1.comments > 0 || u1.posts > 0 || u2.comments > 0 || u2.posts > 0) {
    return "suspicious";
  }

  return "not_done";
};
