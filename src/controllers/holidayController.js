const customMoHolidayModel = require("../models/customMoHolidayModel");

// -------------------------------------------------------- month holiday controller --------------------------------------------------------
//API : post : /holiday/customMonHoliday
const holidyController = async (req, res) => {
  try {
    // -------------- getting informatin from body --------------

    const { holidayName, holidayStartDate, holidayEndDate, createdBy } =req.body;

    // -------------- validation --------------
    if (!holidayName || !holidayStartDate || !holidayEndDate || !createdBy) { return res .status(400).json({ success_status: "failed", message: "All fields are required" });}

    // -------------- holiday validation --------------
    const exisitHoliday = await customMoHolidayModel.findOne({ holidayName,holidayStartDate: new Date(holidayStartDate),holidayEndDate: new Date(holidayEndDate),});

    if (exisitHoliday) {return res.status(400).json({ success_status: "failed", message: "Holiday already exists" });}

    // -------------- creating new holiday --------------
    await customMoHolidayModel({
      holidayName,
      holidayStartDate,
      holidayEndDate,
      // createdBy,
    }).save();

    // -------------- success response --------------
    res.status(200).json({
      success_status: "success",
      message: "Custom month holiday added successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success_status: "failed", message: "Internal server error" });
  }
};

// -------------------------------------------------------- get_custom_holiday controller --------------------------------------------------------
//API : get : /holiday/getCustomHoliday
const get_custom_holiday = async (req, res) => {
  try {
    // ------------ pageination parameters --------------
    const limit = parseInt(req.query.limit) || 10; // default 10 items per page
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    // ------------- fetching holidays from database --------------
    const holidays = await customMoHolidayModel.find() .sort({ createdAt: -1 }).skip(skip).limit(limit);

    // -------------- no holiday found --------------
    if (holidays.length === 0) {return res.status(404).json({ success_status: "failed", message: "No holidays found" });}

    // -------------- success response --------------
    res.status(200).json({ success_status: "success", data: holidays });
  } catch (err) {
    console.error(err);
     res.status(500).json({success_status: "failed",message: "Internal server error",skip,limit,page,});
  }
};

module.exports = { holidyController, get_custom_holiday };
