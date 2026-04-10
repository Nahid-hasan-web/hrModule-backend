// controllers/uploadSheetData.js
const XLSX = require("xlsx");
const attendanceDataModel = require("../models/attendanceDataModel");

const normalizeExcelTime = (value) => {
  if (value === "" || value === null || value === undefined) return "";

  // If Excel gives decimal time like 0.7888888889
  if (typeof value === "number") {
    const totalMinutes = Math.round(value * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }

  // If already string
  return value.toString().trim();
};

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

    const mappedData = sheetData.map((row) => {
      const inTime = normalizeExcelTime(row["Clock In"]);
      const outTime = normalizeExcelTime(row["Clock Out"]);

      console.log(
        row["Date"],
        row["Clock In"],
        typeof row["Clock In"],
        "=>",
        inTime,
        "|",
        row["Clock Out"],
        typeof row["Clock Out"],
        "=>",
        outTime
      );

      return {
        employeeId: row["AC-No."]?.toString().trim(),
        name: row["Name"]?.toString().trim(),
        date: row["Date"]?.toString().trim(),
        inTime,
        outTime,
        late: row["Late"] || null,
        early: row["Early"] || null,
        isAbsent:
          (row["Absent"] ?? "").toString().trim().toLowerCase() === "true",
      };
    });

    const validData = mappedData.filter((d) => d.employeeId && d.name && d.date);

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