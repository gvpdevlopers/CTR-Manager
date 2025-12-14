const PlatformTask = require("../models/PlatformTask");

// ✅ ADMIN: Add Task / Keyword
exports.createTask = async (req, res) => {
  try {
    const { platform, title, keywordOrTask, category } = req.body;

    if (!platform || !title || !keywordOrTask) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const task = await PlatformTask.create({
      platform,
      title,
      keywordOrTask,
      category,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Create Task Error:", error.message);
    res.status(500).json({ message: "Failed to create task" });
  }
};

// ✅ ADMIN + EMPLOYEE: Get All Tasks
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await PlatformTask.find({ isActive: true }).sort({
      createdAt: -1,
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

// ✅ ADMIN: Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await PlatformTask.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.deleteOne();
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task" });
  }
};
