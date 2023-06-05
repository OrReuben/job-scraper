// module.exports.scrapeJobmaster = async (req, res) => {
//   try {
//     const startingScriptTime = new Date().getTime();
//     // const keywords = [
//     //   "Fullstack",
//     //   "ReactJS",
//     //   "Frontend",
//     //   "Backend",
//     //   "CSS",
//     //   "HTML",
//     //   "Typescript",
//     //   "NodeJS",
//     //   "Javascript",
//     // ];
//     const keywords = ["Fullstack"];
//     const browser = await puppeteer.launch({ headless: false });
//     const page = await browser.newPage();
//     page.on("dialog", async (dialog) => {
//       console.log(`Dialog message: ${dialog.message()}`);
//       await dialog.dismiss();
//     });
//     const checkInterval = setInterval(async () => {
//       await closePopupIfExists(page, "#modal_closebtn");
//     }, 1000);
//     const allJobData = {};
//     const jobData = [];
//     let filteredJobData = [];

//     for (const keyword of keywords) {
//       await page.goto("https://www.jobmaster.co.il/");
//       await page.type("#q", keyword);
//       await Promise.all([page.waitForNavigation(), page.click(".submitFind")]);
//       await page.waitForSelector("#desktopResultsHeader");
//       const pageCountEl = await page.$("#desktopResultsHeader");
//       const pageCountRaw = await page.evaluate(
//         (el) => el.textContent,
//         pageCountEl
//       );
//       const numberRegex = /\d+/g;
//       const pageCount = Number(pageCountRaw.match(numberRegex)[0]);
//       const ceiledPageCount = Math.ceil(pageCount / 10);
//       for (let index = 0; index < ceiledPageCount; index++) {
//         await page.goto(
//           `https://www.jobmaster.co.il/jobs/?currPage=${index + 1}&q=${keyword}`
//         );

//         await page.waitForSelector(".JobItemRight");
//         const jobItems = await page.$$(".JobItemRight");

//         for (let i = 0; i < jobItems.length; i++) {
//           const currentJobItems = await page.$$(".JobItemRight");
//           await currentJobItems[i].click();

//           try {
//             await Promise.race([
//               page.waitForSelector("#enterJob .jobNumStyle"),
//               new Promise((_, reject) =>
//                 setTimeout(() => reject(new Error("Timeout")), 2000)
//               ),
//             ]);
//           } catch (err) {
//             if (err.message === "Timeout") {
//               console.log(
//                 "Job item took too long to load, refreshing and skipping to the next item."
//               );
//               await page.reload();
//               await page.waitForSelector(".JobItemRight");
//               continue;
//             } else {
//               throw err;
//             }
//           }

//           const pageData = await page.evaluate(() => {
//             return {
//               html: document.documentElement.innerHTML,
//             };
//           });
//           const $ = cheerio.load(pageData.html);

//           const title = $("#enterJob .jobHead__text .CardHeader").text().trim();
//           const location = $("#enterJob .jobLocation").text().trim();
//           const type = $("#enterJob .jobType").text().trim();
//           const jobIdText = $("#enterJob .jobNumStyle").text().trim();
//           const jobId =
//             (jobIdText && jobIdText.match(numberRegex)[0]) || "No ID";
//           const link = `https://www.jobmaster.co.il/jobs/checknum.asp?key=${jobId}`;
//           const description = $("#jobFullDetails .jobDescription")
//             .text()
//             .trim()
//             .replace(/[\n\t]+/g, " ");
//           const requirements = $("#jobFullDetails .jobRequirements")
//             .text()
//             .trim()
//             .replace(/[\n\t]+/g, " ");

//           const oneJobData = {
//             title,
//             location,
//             type,
//             link,
//             description,
//             requirements,
//           };
//           jobData.push(oneJobData);
//         }
//         const regex1 = /[3-7]/;
//         const regex2 =
//           /(^|\W)(2|\u{05E9}\u{05E0}\u{05EA}\u{05D9}\u{05D9}\u{05DD}|two)($|\W)/iu;
//         const regex3 = /(^|\W)(1|\u{05E9}\u{05E0}\u{05D4}|one)($|\W)/iu;
//         const regex4 = /\d/;

//         filteredJobData = jobData.filter(({ requirements }) => {
//           if (regex1.test(requirements)) {
//             return false;
//           } else if (regex2.test(requirements)) {
//             if (regex3.test(requirements)) {
//               return true;
//             }
//             return false;
//           } else if (regex3.test(requirements)) {
//             return true;
//           } else if (!regex4.test(requirements)) {
//             return true;
//           }
//         });
//         allJobData[keyword] = filteredJobData;
//       }
//     }
//     clearInterval(checkInterval);
//     setTimeout(async () => {
//       await browser.close();
//     }, 500);
//     try {
//       await executeSheets(allJobData, "Jobmaster");
//       const endingScriptTime = new Date().getTime();
//       const calculateToMinutes = Math.floor(
//         (endingScriptTime - startingScriptTime) / 1000 / 60
//       );
//       res.status(201).json(
//         `Executed Successfully.
//           Scraped from: ${jobData.length} jobs,
//           resulted in ${filteredJobData.length} jobs.
//           Operation took: ${calculateToMinutes} Minutes`
//       );
//     } catch (err) {
//       res.status(400).json("Something went wrong: " + err.message);
//     }
//   } catch (err) {
//     res.status(500).json("Something went wrong: " + err.message);
//   }
// };