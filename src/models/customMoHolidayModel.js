const mongoose = require("mongoose");

const customMoHolidaySchema = new mongoose.Schema(
  {
    holidayName: { type: String, required: true, trim: true },

    holidayStartDate: { type: Date, required: true },

    holidayEndDate: { type: Date, required: true },
    
    // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth", required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CustomMoHoliday", customMoHolidaySchema);
