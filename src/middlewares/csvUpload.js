// src/middlewares/csvUpload.js

const multer = require(
    "multer"
  );
  
  /* ======================================================
     MEMORY STORAGE
  ====================================================== */
  
  const storage =
    multer.memoryStorage();
  
  /* ======================================================
     FILE FILTER
  ====================================================== */
  
  const fileFilter = (
    req,
    file,
    cb
  ) => {
  
    const allowedMimeTypes =
      [
        "text/csv",
  
        "application/vnd.ms-excel",
  
        "application/csv",
      ];
  
    const isCSV =
      allowedMimeTypes.includes(
        file.mimetype
      ) ||
      file.originalname
        .toLowerCase()
        .endsWith(".csv");
  
    if (!isCSV) {
  
      return cb(
        new Error(
          "Only CSV files are allowed"
        ),
  
        false
      );
    }
  
    cb(null, true);
  };
  
  /* ======================================================
     MULTER CONFIG
  ====================================================== */
  
  const upload =
    multer({
      storage,
  
      fileFilter,
  
      limits: {
        fileSize:
          5 *
          1024 *
          1024, // 5MB
      },
    });
  
  /* ======================================================
     EXPORT
  ====================================================== */
  
  module.exports = upload;