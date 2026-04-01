const express  = require('express')
const emplyeeApi = require('./api/emplyeeApi')
const holiydayApi = require('./api/holidayApi')
const leaveApi = require('./api/leaveApi')
const attendanceApi = require('./api/attendanceApi')
const myRoute  = express.Router()
const reportApi = require('./api/reportApi')
const scheduleApi = require('./api/scheduleApi')

// ---------  emplyee route
myRoute.use('/empolyee' , emplyeeApi)

// ---------  holiday route
myRoute.use('/holiday' , holiydayApi )

// ---------  leave route
myRoute.use('/leave' , leaveApi )

// ---------  attendance route
myRoute.use('/attendance' , attendanceApi )

// ---------  report route
myRoute.use('/report' ,  reportApi)

// ---------  schedule route
myRoute.use('/schedule' , scheduleApi)


module.exports  = myRoute