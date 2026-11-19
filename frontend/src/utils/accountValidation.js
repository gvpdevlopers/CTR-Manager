const fields = {
  instagram: { name: "Name", username: "Username", userId: "User ID", password: "Password", link: "Profile link" },
  quora: { userId: "User ID", name1: "Name 1", email1: "Email 1", password1: "Password 1", name2: "Name 2", email2: "Email 2", password2: "Password 2" },
  reddit: { userId: "User ID", name1: "Name 1", email1: "Email 1", password1: "Password 1", name2: "Name 2", email2: "Email 2", password2: "Password 2" },
  bhw: { userId: "User ID", name: "Name", email: "Email", password: "Password", link: "Profile link" },
};
export function validateAccount(platform, values) {
  const errors = {};
  for (const [key, label] of Object.entries(fields[platform] || {})) {
    if (!String(values[key] ?? "").trim()) errors[key] = `${label} is required.`;
  }
  if (platform === "instagram" && values.userId && !/^\d+$/.test(String(values.userId).trim())) errors.userId = "Instagram user ID must be numeric.";
  if (platform === "quora" && values.profileUrl) {
    try {
      const url = new URL(values.profileUrl);
      if (url.protocol !== "https:" || !["quora.com", "www.quora.com"].includes(url.hostname.toLowerCase()) || url.username || url.password || url.port || !/^\/profile\/[^/]+\/?$/.test(url.pathname)) throw new Error();
    } catch { errors.profileUrl = "Enter a valid HTTPS Quora profile URL."; }
  }
  return errors;
}
