const { Site } = require("../models/siteModel");

const getAllJobs = async (req, res) => {
  try {
    const { page, website, any } = req.query;

    let query = {};

    if (website) {
      query.website = { $regex: new RegExp(website, "i") };
    }

    const allSitesData = await Site.find(query);
    let allJobsCombined = allSitesData.flatMap((site) => site.jobs);

    const filterKeys = [
      "website",
      "title",
      "location",
      "type",
      "ID",
      "link",
      "description",
      "requirements",
      "keyword",
    ];

    if (any) {
      allJobsCombined = allJobsCombined.filter((job) => {
        for (const key of filterKeys) {
          const value = job[key];
          if (value && value.toString().includes(any)) {
            return true;
          }
        }
        return false;
      });
    }

    if (page) {
      const pageSize = 10; // Number of jobs per page
      const startIndex = (page - 1) * pageSize;
      const endIndex = page * pageSize;
      allJobsCombined = allJobsCombined.slice(startIndex, endIndex);
    }

    res.status(200).json(allJobsCombined);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

module.exports = { getAllJobs };
