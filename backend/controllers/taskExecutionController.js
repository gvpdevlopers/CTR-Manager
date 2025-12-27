const TaskExecution = require("../models/TaskExecution");
const PlatformTask = require("../models/PlatformTask");

exports.markTaskDone = async (req, res) => {
  try {
    const { accountId, platform = "instagram" } = req.body;
    const employeeId = req.user._id;

    const taskDate = new Date();
    taskDate.setHours(0, 0, 0, 0);

    const exists = await TaskExecution.findOne({
      employeeId,
      accountId,
      platform,
      taskDate,
    });

    if (!exists) {
      await TaskExecution.create({
        employeeId,
        accountId,
        platform,
        taskDate,
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ MARK DONE ERROR:", err);
    res.status(500).json({ message: "Failed to mark CTR" });
  }
};

exports.getTodayExecutions = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = new Date().toISOString().split("T")[0];

    const executions = await TaskExecution.find({
      employeeId,
      date: today,
    }).select("accountId taskId platform");

    res.json(executions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch executions" });
  }
};

exports.adminResetExecution = async (req, res) => {
  try {
    const { id } = req.params;

    const execution = await TaskExecution.findById(id);
    if (!execution) {
      return res.status(404).json({ message: "Execution not found" });
    }

    await execution.deleteOne();

    res.json({ message: "CTR reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to reset CTR" });
  }
};

exports.adminResetExecution = async (req, res) => {
  try {
    const { id } = req.params;

    const execution = await TaskExecution.findById(id);
    if (!execution) {
      return res.status(404).json({ message: "Execution not found" });
    }

    await execution.deleteOne();

    res.json({ message: "CTR reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to reset CTR" });
  }
};
