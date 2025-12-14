import { useState } from "react";
import API from "../../services/api";

export default function BulkPasteAccounts({ refresh }) {
  const [text, setText] = useState("");

  const handleBulkSubmit = async () => {
    const rows = text
      .split("\n")
      .map((row) => row.trim())
      .filter(Boolean);

    if (rows.length === 0) {
      alert("No data found");
      return;
    }

    try {
      for (let row of rows) {
        const [platform, username, profileLink] = row.split(",");

        if (!platform || !username || !profileLink) continue;

        await API.post("/platform-accounts", {
          platform: platform.trim().toLowerCase(),
          username: username.trim(),
          profileLink: profileLink.trim(),
          status: "active",
        });
      }

      setText("");
      refresh();
      alert("Bulk accounts added");
    } catch (err) {
      alert("Bulk upload failed");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      <h2 className="text-lg font-bold mb-3 dark:text-white">
        Bulk Paste (Google Sheet Style)
      </h2>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows="5"
        className="w-full p-2 border rounded mb-3"
        placeholder="platform,username,profileLink"
      />

      <button
        onClick={handleBulkSubmit}
        className="bg-green-600 text-white px-4 py-1 rounded"
      >
        Add in Bulk
      </button>
    </div>
  );
}
