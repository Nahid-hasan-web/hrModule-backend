// models/Employee.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    inTime: {
      type: String, // example: "09:15"
      default: "",
    },

    outTime: {
      type: String, // example: "18:05"
      default: "",
    },

    late: {
      type: String, 
      default: null,
    },

    early: {
      type: String,
      default: null,
    },

    isAbsent: {
      type: Boolean,
      default: false,
    },
    date: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("attendanceData", attendanceSchema);
