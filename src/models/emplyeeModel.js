const mongoose = require("mongoose");
const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },

    name: { type: String, required: true, trim: true },

    department: { type: String, required: true, trim: true },

    employeeType: { type: String, required: true, enum: ["OFFICER", "STAFF"] },

    projects: { type: String, default: "CDL" },

    isOnProbation: { type: Boolean, default: false },

    dayoff: {
      type: String,
      default: "firday",
      enum: [
        "saturday",
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "firday",
      ],
    },

    availableLeave: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    inTime: {
      type: Date,
      default: () => new Date("2025-01-01T10:59:00Z"),
    },

    outTime: {
      type: Date,
      default: () => new Date("2025-01-01T17:59:00Z"),
    },
    // createdBy: { type: Schema.Types.ObjectId, ref: "auth", requyired: true},
  },

  { timestamps: true },
);

module.exports = mongoose.model("EmplyeeList", employeeSchema);
