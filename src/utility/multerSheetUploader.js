const multer = require("multer");

const multerSheetUploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isValid =
      file.mimetype.includes("spreadsheet") ||
      file.mimetype.includes("excel") ||
      file.mimetype === "text/csv" ||
      /\.(xlsx|xls|csv)$/i.test(file.originalname);

    if (!isValid) {
      return cb(new Error("Only xlsx, xls, csv allowed"));
    }
    cb(null, true);
  },
});

module.exports = multerSheetUploader;
