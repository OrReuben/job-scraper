const express = require("express");
const { scrapeJobmaster } = require("../controllers/jobmaster_controller");
const { resetSheetData } = require("../controllers/reset_sheet_data");
const router = express.Router();
require("dotenv").config();

router.get("/jobmaster", scrapeJobmaster);
router.get('/reset', resetSheetData)

module.exports = router;
