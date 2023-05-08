const express = require("express");
const { scrapeJobmaster } = require("../controllers/jobmaster_controller");
const { resetSheetData } = require("../controllers/reset_sheet_data");
const { scrapeMatrix } = require("../controllers/matrix_controller");
const { scrapeDrushim } = require("../controllers/drushim_controller");
const { scrapeSQLink } = require("../controllers/SQLink_controller");
const { scrapeAllJobs } = require("../controllers/alljobs_controller");
const router = express.Router();
require("dotenv").config();

router.get("/jobmaster", scrapeJobmaster);
router.get("/matrix", scrapeMatrix);
router.get("/drushim", scrapeDrushim);
router.get("/sqlink", scrapeSQLink);
router.get("/alljobs", scrapeAllJobs);
router.get('/reset', resetSheetData)

module.exports = router;
