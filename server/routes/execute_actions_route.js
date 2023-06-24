const express = require("express");
const { scrapeJobmaster } = require("../controllers/jobmaster_controller");
const { resetSheetData } = require("../controllers/reset_sheet_data");
const { scrapeMatrix } = require("../controllers/matrix_controller");
const { scrapeDrushim } = require("../controllers/drushim_controller");
const { scrapeSQLink } = require("../controllers/SQLink_controller");
const { scrapeAllJobs } = require("../controllers/alljobs_controller");
const { scrapeLinkedin } = require("../controllers/linkedin_controller");
const router = express.Router();
require("dotenv").config();

router.post("/jobmaster", scrapeJobmaster);
router.post("/matrix", scrapeMatrix);
router.post("/drushim", scrapeDrushim);
router.post("/sqlink", scrapeSQLink);
router.post("/alljobs", scrapeAllJobs);
router.post("/linkedin", scrapeLinkedin);
router.post('/reset', resetSheetData)

module.exports = router;
