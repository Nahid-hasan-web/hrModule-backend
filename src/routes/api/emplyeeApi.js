const express = require('express')
const { addEmployee, get_emplyee_controller, add_remark } = require('../../controllers/employeeController')
const emplyeeApi = express.Router()

emplyeeApi.post('/add_emplyee' , addEmployee)

emplyeeApi.get('/get_emplyee' , get_emplyee_controller)

emplyeeApi.post('/add-remark' , add_remark)

module.exports = emplyeeApi 