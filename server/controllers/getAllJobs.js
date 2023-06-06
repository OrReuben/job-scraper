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
          if (value && value.toString().toLowerCase().includes(any.toLowerCase())) {
            return true;
          }
        }
        return false;
      });
    }
    const jobCount = allJobsCombined.length;

    if (page) {
      const pageSize = 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = page * pageSize;
      allJobsCombined = allJobsCombined.slice(startIndex, endIndex);
    }

    res.status(200).json({ jobs: allJobsCombined, count: jobCount });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

module.exports = { getAllJobs };
