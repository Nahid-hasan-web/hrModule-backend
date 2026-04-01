const express =require('express');
const { uploadSheetData } = require('../../controllers/uploadSheetData');
const multerSheetUploader = require('../../utility/multerSheetUploader');
const attendanceApi = express.Router();

// --------------- upload sheet data ---------------
attendanceApi.post('/uploadSheetData', multerSheetUploader.single('sheet'),  uploadSheetData);



module.exports = attendanceApi;