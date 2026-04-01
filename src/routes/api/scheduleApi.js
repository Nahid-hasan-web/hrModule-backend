const express  = require('express')
const { get_common_schedul_controller, create_common_schedul_controller, update_common_schedule_controller, delete_common_schedule_controller} = require('../../controllers/scheduleContoller')
const scheduleApi = express.Router()


scheduleApi.post('/create-common-schedule' , create_common_schedul_controller )

scheduleApi.get('/get-common-schedule' , get_common_schedul_controller )

scheduleApi.patch('/update-common-schedule/:id' , update_common_schedule_controller )

scheduleApi.delete('/delete-common-schedule/:id' , delete_common_schedule_controller )





module.exports  = scheduleApi


