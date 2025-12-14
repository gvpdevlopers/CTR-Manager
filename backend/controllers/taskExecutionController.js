const TaskExecution = require("../models/TaskExecution");
const PlatformTask = require("../models/PlatformTask");

exports.markTaskDone = async (req, res) => {
  try {
    const { accountId, accountModel, taskId, platform } = req.body;

    const employeeId = req.user._id;
    const today = new Date().toISOString().split("T")[0];

    // Validate task exists
    const task = await PlatformTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const execution = await TaskExecution.create({
      employeeId,
      accountId,
      accountModel,
      taskId,
      platform,
      date: today,
    });

    res.status(201).json({
      message: "CTR marked as done",
      execution,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "CTR already marked for today" });
    }

    console.error(error);
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
