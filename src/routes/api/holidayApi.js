const express  = require('express');
const {holidyController, get_custom_holiday} = require('../../controllers/holidayController');
const holiydayApi   = express.Router();

holiydayApi.post('/customMonHoliday', holidyController )

holiydayApi.get('/getCustomHoliday', get_custom_holiday )


module.exports = holiydayApi;