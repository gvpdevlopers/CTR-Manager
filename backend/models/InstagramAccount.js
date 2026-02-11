const mongoose = require("mongoose");

const instagramAccountSchema = new mongoose.Schema(
  {
    ownedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    link: { type: String, required: true },
    userId: {
  type: Number,
  required: true,
  unique: true,
},


    status: {
      type: String,
      enum: ["working", "suspicious", "not_working"],
      default: "working",
    },

    // Automation-ready fields
    lastCheckedAt: { type: Date, default: null },
    ctrDone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InstagramAccount", instagramAccountSchema);
