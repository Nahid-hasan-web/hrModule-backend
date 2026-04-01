const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  scheduleName: {
    type: String,
    required: true,
  },
  scheduleFrom: {
    type: Date,
    required: true,
  },
  scheduleTo: {
    type: Date,
    required: true,
  },
  scheduleStartTime: {
    type: Date,
    default:null,
  },
  scheduleEndtTime: {
    type: Date,
    default:null,
  },
});

module.exports = mongoose.model("commonSchedule", scheduleSchema);
