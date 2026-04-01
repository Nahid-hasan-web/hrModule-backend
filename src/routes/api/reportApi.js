const express  = require('express')
const { reportController } = require('../../controllers/reportController')
const reportApi = express.Router()


reportApi.get('/get-report' , reportController )





module.exports  = reportApi


