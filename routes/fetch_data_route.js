const express = require("express");
const { getAllJobs } = require("../controllers/getAllJobs");
const router = express.Router();
require("dotenv").config();


router.get('/jobs', getAllJobs)

module.exports = router