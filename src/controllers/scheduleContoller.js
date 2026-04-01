// ------------------------------------ create common shcedule
// -------- API : /schedule/create-common-schedule

const commonSchedule = require("../models/commonSchedule");

// Controller to create a new schedule
const create_common_schedul_controller = async (req, res) => {
  try {
    // Destructure the schedule data from the request body
    const {
      scheduleName,
      scheduleFrom,
      scheduleTo,
      scheduleStartTime,
      scheduleEndtTime,
    } = req.body;

    // Validate the required fields
    if (
      !scheduleName ||
      !scheduleFrom ||
      !scheduleTo ||
      !scheduleStartTime ||
      !scheduleEndtTime
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create a new schedule instance
    const newSchedule = new commonSchedule({
      scheduleName,
      scheduleFrom,
      scheduleTo,
      scheduleStartTime,
      scheduleEndtTime,
    });

    // Save the schedule to the database
    await newSchedule.save();

    // Send success response
    return res.status(201).json({
      message: "Schedule created successfully",
      data: newSchedule,
    });
  } catch (err) {
    // Handle errors
    return res.status(500).json({
      message: `Internal server error from create_common_schedul_controller: ${err.message}`,
    });
  }
};

// ---------------------------------------------------------------------------------------------- get common shcedule
// -------- API : /schedule/get-common-schedule
// -------- API : /schedule/get-common-schedule?month=2026-04
// -------- API : /schedule/get-common-schedule?startDate=2026-04-01&endDate=2026-04-10

const get_common_schedul_controller = async (req, res) => {
  try {
    // Get query parameters for filtering
    const { month, startDate, endDate } = req.query;

    // Build the query object based on the filters
    let query = {};

    // Filter by month if 'month' query parameter is provided (example: '2026-04')
    if (month) {
      const startOfMonth = new Date(month + "-01"); // First day of the month
      const endOfMonth = new Date(month + "-01");
      endOfMonth.setMonth(endOfMonth.getMonth() + 1); // Get the first day of the next month

      query.scheduleFrom = { $gte: startOfMonth, $lt: endOfMonth };
    }

    // Filter by date range if 'startDate' and 'endDate' query parameters are provided
    if (startDate && endDate) {
      query.scheduleFrom = {
        ...query.scheduleFrom, // Keep existing filter (e.g., month filter)
        $gte: new Date(startDate),
        $lt: new Date(endDate),
      };
    }

    // Get all schedules, optionally filtered
    const schedules = await commonSchedule
      .find(query)
      .sort({ createdAt: -1 }) // Sort by the most recently created first
      .exec();

    // Send the response with the schedules
    res.status(200).json({
      message: "successfully",
      data: schedules,
    });
  } catch (err) {
    // Handle errors
    res.status(500).json({
      message: `Internal server error from get_common_schedul_controller: ${err.message}`,
    });
  }
};

// ----------------------------------------------------------------------------------------------- update common shcedule
// -------- API : /schedule/update-common-schedule/:id

const update_common_schedule_controller = async (req, res) => {
  try {
    // Extract the schedule ID and the fields to update from the request body
    const { id } = req.params; // Extract the ID from the URL parameters
    const {
      scheduleName,
      scheduleStartDate,
      scheduleEndDate,
      scheduleStartTime,
      scheduleEndTime,
    } = req.body;

    // Find the schedule by ID
    const schedule = await commonSchedule.findById(id);

    // If schedule doesn't exist, return 404
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Update the schedule with the new values
    if (scheduleName) schedule.scheduleName = scheduleName;
    if (scheduleStartDate) schedule.scheduleFrom = new Date(scheduleStartDate);
    if (scheduleEndDate) schedule.scheduleTo = new Date(scheduleEndDate);
    if (scheduleStartTime)
      schedule.scheduleStartTime = new Date(scheduleStartTime);
    if (scheduleEndTime) schedule.scheduleEndtTime = new Date(scheduleEndTime);

    // Save the updated schedule
    const updatedSchedule = await schedule.save();

    // Send the response with the updated schedule
    res.status(200).json({
      message: "Schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (err) {
    // Handle errors
    res.status(500).json({
      message: `Internal server error from update_common_schedule_controller: ${err.message}`,
    });
  }
};

// ---------------------------------------------------------------------------------------------- update common shcedule
// -------- API : /schedule/delete-common-schedule/:id

const delete_common_schedule_controller = async (req, res) => {
  try {
    // Extract the schedule ID from the URL parameters
    const { id } = req.params;

    // Find the schedule by ID and delete it
    const schedule = await commonSchedule.findByIdAndDelete(id);

    // If schedule doesn't exist, return 404
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Send success response
    res.status(200).json({
      message: "Schedule deleted successfully",
      data: schedule,
    });
  } catch (err) {
    // Handle errors
    res.status(500).json({
      message: `Internal server error from delete_common_schedule_controller: ${err.message}`,
    });
  }
};

module.exports = {
  create_common_schedul_controller,
  get_common_schedul_controller,
  update_common_schedule_controller,
  delete_common_schedule_controller,
};
