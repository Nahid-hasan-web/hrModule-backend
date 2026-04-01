const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      require: true,
    },
    approval: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
    },
    date: {
      type: Date,
      require: true,
    },
    remark: {
      type: String,
      require: true,
      enum: [
        "On Duty (Morning / Evening)",
        "Short Leave (Morning / Evening)",
        "Half Day Paid Leave (Morning / Evening)",
        "Half Day Unpaid Leave (Morning / Evening)",
        "Official Duty (Full Day)",
        "Absent (Forcefully)",
        "Replacement Duty",
      ],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Remark", statusSchema);
