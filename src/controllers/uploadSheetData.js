// controllers/uploadSheetData.js
const XLSX = require("xlsx");
const attendanceDataModel = require("../models/attendanceDataModel"); 

const uploadSheetData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const sheetData = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      blankrows: false,
    });

    const mappedData = sheetData.map((row) => ({
      employeeId: row["AC-No."]?.toString().trim(),
      name: row["Name"]?.toString().trim(),
      date: row["Date"]?.toString().trim(), // IMPORTANT
      inTime: row["Clock In"] || "",
      outTime: row["Clock Out"] || "",
      late: row["Late"] || null,
      early: row["Early"] || null,
      isAbsent: (row["Absent"] ?? "").toString().trim().toLowerCase() === "true",
    }));

    const validData = mappedData.filter(
      (d) => d.employeeId && d.name && d.date
    );

    const inserted = await attendanceDataModel.insertMany(validData, {
      ordered: false,
    });

    return res.json({
      ok: true,
      totalRows: sheetData.length,
      validRows: validData.length,
      inserted: inserted.length,
      skipped: sheetData.length - validData.length,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Upload failed",
      error: error.message,
    });
  }
};

module.exports = { uploadSheetData };
