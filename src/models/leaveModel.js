const mongoose = require("mongoose");

const leaveModeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: Number,
      required: true,
    },
    leavetype: {
      type: String,
      default:"withpay",
      enum: ["withpay", "withoutpay"],
    },
    leaveAmmount: {
      type: Number,
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    remark:{
      type:String,
      default:"Leave"
    }
  },
  { timestamps: true },
);

module.exports = mongoose.model("LeaveLlist", leaveModeSchema);
