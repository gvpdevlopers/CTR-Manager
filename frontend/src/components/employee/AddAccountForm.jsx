import { useState } from "react";
import API from "../../services/api";

export default function AddAccountForm({ refresh }) {
  const [platform, setPlatform] = useState("instagram");
  const [username, setUsername] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [devPass, setDevPass] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/platform-accounts", {
        platform,
        username,
        profileLink,
        devPlatformPasswordEncrypted: devPass,
        status: "active",
      });

      setUsername("");
      setProfileLink("");
      setDevPass("");
      refresh();
    } catch (err) {
      alert("Failed to add account");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      <h2 className="text-lg font-bold mb-3 dark:text-white">
        Add Platform Account
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-5 gap-3"
      >
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="instagram">Instagram</option>
          <option value="reddit">Reddit</option>
          <option value="quora">Quora</option>
          <option value="bhw">BHW</option>
        </select>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="p-2 border rounded"
          required
        />

        <input
          placeholder="Profile Link"
          value={profileLink}
          onChange={(e) => setProfileLink(e.target.value)}
          className="p-2 border rounded"
          required
        />

        <input
          placeholder="Dev Password (optional)"
          value={devPass}
          onChange={(e) => setDevPass(e.target.value)}
          className="p-2 border rounded"
        />

        <button className="bg-blue-600 text-white rounded px-4">Add</button>
      </form>
    </div>
  );
}
