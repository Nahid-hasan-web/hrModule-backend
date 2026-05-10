const leaveModel = require("../models/leaveModel");

// ---------------------------------------------------- Create Leave Controller ----------------------------------------------------
//api : POST : leave/createLeave

const createLeave = async (req, res) => {
  try {
    // ------------- getting data from the request body
    const {
      leavetype,
      startDate,
      endDate,
      reason,
      employeeId,
      leaveAmmount,
      remark,
    } = req.body;

    // ------------- validaiton for required fields
    if (
      !employeeId ||
      !leavetype ||
      !startDate ||
      !endDate ||
      !leaveAmmount ||
      !remark
    ) {
      return res
        .status(400)
        .json({
          success_status: "failed",
          message:
            "Please provide all required fields: leavetype, startDate, endDate , employeeId , leaveAmmount",
        });
    }

    //-------------  creating new leave
    await new leaveModel({
      leavetype,
      startDate,
      endDate,
      reason,
      employeeId,
      leaveAmmount,
      remark,
    }).save();

    res
      .status(200)
      .json({
        employeeId,
        success_status: "success",
        message: "Leave created successfully",
      });
  } catch (err) {
    console.error("create leave controller", err);
    res.status(500).json({
      success_status: "failed",
      message: `Internal server error from  leaveController/createLeave ${err}`,
    });
  }
};
// ---------------------------------------------------- get Leave Controller ----------------------------------------------------
//api : GET : leave/get-leaves
// future improvement : filtering by status , date range , employeeId , depertment , project.
const get_leaves = async (req, res) => {
  try {
    // ------------ pageination parameters
    const limit = parseInt(req.query.limit) || 10; // default 10 items per page
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    // ------------ fetching leaves from database with pagination
    const leaves = await leaveModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    // ------------ sending response
    res
      .status(200)
      .json({
        success_status: "success",
        data: leaves,
        message: "Leaves fetched successfully",
        page,
        limit,
        skip,
      });
  } catch (err) {
    console.error("create  get_leaves controller ", err);
    res
      .status(500)
      .json({
        success_status: "failed",
        message: "Internal server error from  leaveController/get_leaves",
      });
  }
};

module.exports = { createLeave , get_leaves };
