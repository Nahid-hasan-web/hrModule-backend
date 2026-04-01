const emplyeeModel = require("../models/emplyeeModel");
const remarkModel = require("../models/remarkModel");
// ============================================================================ add emplyeee controller ============================================================================
// API : post : /empolyee/add_emplyee
const addEmployee = async (req, res) => {
  try {
    // ----------- geting data from the request body -------------
    const {
      name,
      employeeId,
      department,
      employeeType,
      projects,
      isOnProbation,
      dayoff,
      availableLeave,
      isActive,
      createdBy,
    } = req.body;

    // ----------- body data validation -------------
    if (
      !name ||
      !employeeId ||
      !department ||
      !employeeType ||
      !projects ||
      typeof isOnProbation !== "boolean" ||
      !dayoff ||
      availableLeave == null ||
      typeof isActive !== "boolean"
    )
      return res.status(400).json({
        success_status: "failed",
        message: "All fields are required",
      });

    // ------------------- set emplyee intime and outtime for STAFF type -------------------
    let shiftStartTime;
    let shiftEndTime;

    const baseDate = new Date(); // today

    if (employeeType === "STAFF") {
      shiftStartTime = new Date(baseDate);
      shiftStartTime.setHours(9, 30, 59, 0);

      shiftEndTime = new Date(baseDate);
      shiftEndTime.setHours(18, 29, 59, 0);
    } else {
      shiftStartTime = new Date(baseDate);
      shiftStartTime.setHours(10, 0, 59, 0);

      shiftEndTime = new Date(baseDate);
      shiftEndTime.setHours(18, 29, 59, 0);
    }

    console.log("Shift Start Time:", shiftStartTime.toLocaleString());
    console.log("Shift End Time:", shiftEndTime.toLocaleString());

    //   -----------  check for existing employeeId -------------
    const existingEmployee = await emplyeeModel.findOne({ employeeId });

    if (existingEmployee)
      return res.status(409).json({ message: "Employee ID already exists" });

    //   -----------  saving data to DB   -------------
    await new emplyeeModel({
      name,
      employeeId,
      department,
      employeeType,
      projects,
      isOnProbation,
      dayoff,
      availableLeave,
      isActive,
      inTime:shiftStartTime,
      outTime:shiftEndTime,
    }).save();

    // ----------- send response -------------

    res.status(201).json({ message: "Emplyee added successfully" });
  } catch (err) {
    console.error("Error in addEmployee controller:", err);
    res
      .status(500)
      .json({ success_status: "failed", message: "Internal server error" });
  }
};

// ============================================================================ add emplyeee controller ============================================================================
// API : get : /empolyee/get_emplyee
const get_emplyee_controller = async (req, res) => {
  try {
    // ------------ pageination parameters --------------
    const limit = parseInt(req.query.limit) || 10; // default 10 items per page
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // ----------- fetching employees from database --------------
    const employees = await emplyeeModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    // -------------- no employee found --------------
    if (employees.length === 0) {
      return res
        .status(404)
        .json({ success_status: "failed", message: "No employees found" });
    }
    // -------------- success response --------------
    res
      .status(200)
      .json({ success_status: "success", data: employees, skip, limit, page });
  } catch (err) {
    console.error("Error in get_emplyee_controller:", err);
    res
      .status(500)
      .json({ success_status: "failed", message: "Internal server error" });
  }
};

// ============================================================================ add remark controller ============================================================================
// API : get : /empolyee/add-remark
const add_remark = async (req, res) => {
  try {
    const { employeeId, date, remark, createdBy } = req.body;

    // ------------- validation for body fields ----------------
    if (!employeeId || !date || !remark) {
      return res
        .status(400)
        .json({
          success_status: "failed",
          message: "Please provide all required fields",
        });
    }

    // ------------- searching for exisiting status and update ----------------
    const exisiting_remark = await remarkModel.findOneAndUpdate(
      { employeeId: employeeId, date: date },
      { remark: remark },
      { new: true },
    );
    if (exisiting_remark) {
      return res
        .status(200)
        .json({
          success_status: "success",
          message: "Remark updated successfully",
        });
    }

    // ------------- saveing new status to db ----------------
    await new remarkModel({ employeeId, date, remark }).save();

    // ------------- send response to client ----------------
    res
      .status(200)
      .json({
        success_status: "success",
        message: "Remark added successfully",
      });
  } catch (err) {
    console.error("Error in add_remark:", err);
    res
      .status(500)
      .json({
        success_status: "failed",
        message: "Internal server error remarkController/add_remark",
      });
  }
};

module.exports = { addEmployee, get_emplyee_controller, add_remark };
