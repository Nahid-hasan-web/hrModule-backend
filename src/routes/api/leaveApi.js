const express = require('express');
const { createLeave, get_leaves } = require('../../controllers/leaveController');
const leaveApi = express.Router();

// ------------- create leave 
leaveApi.post('/createLeave' , createLeave)
leaveApi.get('/get-leaves' , get_leaves)

// ----------- 

module.exports = leaveApi;