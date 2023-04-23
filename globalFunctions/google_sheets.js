const fs = require("fs");
const os = require("os");
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const dotenv = require("dotenv");

dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const spreadsheetId = "11Y4ysHMwKZU5bOT7Db6182AvTga8ZawUgSUjpTo13Sc";
const sheetName = "Job Data";

async function loadSavedCredentialsIfExist() {
  try {
    const credentials = JSON.parse(process.env.TOKEN);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = process.env.CREDENTIALS;
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });

  await fs.promises.writeFile(".env", `\nTOKEN=${payload}`, { flag: "a" });
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }

  const credentials = JSON.parse(process.env.CREDENTIALS);

  const tempCredentialsFile = path.join(os.tmpdir(), "temp_credentials.json");
  fs.writeFileSync(tempCredentialsFile, JSON.stringify(credentials));

  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: tempCredentialsFile,
  });

  fs.unlinkSync(tempCredentialsFile);

  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function authenticateSheet(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

function convertDataTo2DArray(data, website) {
  const result = [];
  for (const obj of data) {
    const keyword = obj.keyword
    const title = obj.title;
    const link = obj.link;
    const type = obj.type;
    const location = obj.location;
    const ID = link.split("=")[1];
    result.push([website, keyword, title, link, type, location, ID]);
  }
  return result;
}

async function verifyNewData(sheets, data) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: `${sheetName}!A2:G`,
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    // console.log("No data found.");
    return data;
  }

  const filteredData = data.filter((newRow) => {
    const websiteName = newRow[0];
    const id = newRow[6];

    return !rows.some((row) => row[0] === websiteName && row[6] === id);
  });

  return filteredData;
}

async function appendDataToSheets(sheets, data2DArray) {
  const headers = [
    "Website",
    "Technology",
    "Title",
    "Link",
    "Type",
    "Location",
    "ID",
  ];
  const verifiedData = await verifyNewData(sheets, data2DArray);
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:G1`,
  });

  if (!headerResponse.data.values || headerResponse.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:G1`,
      valueInputOption: "RAW",
      resource: {
        values: [headers],
      },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:G`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    resource: {
      values: verifiedData,
    },
  });
}

async function clearSheets(sheets) {
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: sheetName,
  });
}

async function executeSheets(allJobData, website) {
  try {
    const auth = await authorize();
    const sheets = await authenticateSheet(auth);
    const rows = convertDataTo2DArray(allJobData, website);
    await appendDataToSheets(sheets, rows);
  } catch (error) {
    console.error(error);
  }
}
async function resetSheetsLogic() {
  const auth = await authorize();
  const sheets = await authenticateSheet(auth);
  await clearSheets(sheets);
}

async function resetSheet(req, res){
  try {
    await resetSheetsLogic();
    res.status(200).json("successfully reseted sheets");
  } catch (err) {
    res.status(500).json("something went wrong: " + err.message);
  }
};

module.exports = { executeSheets, resetSheetsLogic, resetSheet };
