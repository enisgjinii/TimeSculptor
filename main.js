const { app, BrowserWindow, ipcMain } = require("electron");
const activeWin = require("active-win");
const fs = require("fs");
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");

let mainWindow;
let csvFilePath = path.join(process.cwd(), "activity.csv"); // Set absolute path for CSV file

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Required to use ipcRenderer
    },
  });

  // Maximize the window to full-screen
  mainWindow.maximize();

  mainWindow.loadFile("index.html");

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.promises.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.promises.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.promises.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client;
  try {
    client = await loadSavedCredentialsIfExist();
    if (client) {
      return client;
    }
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await saveCredentials(client);
    }
    return client;
  } catch (error) {
    console.error("Authorization failed:", error);
    throw error;
  }
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listEvents(auth) {
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });
  const events = res.data.items;
  if (!events || events.length === 0) {
    console.log("No upcoming events found.");
    return;
  }
  console.log("Upcoming 10 events:");
  events.map((event, i) => {
    const start = event.start.dateTime || event.start.date;
    console.log(`${start} - ${event.summary}`);
  });
}

authorize().then(listEvents).catch(console.error);

function saveToCSV(data) {
  fs.appendFile(csvFilePath, data + "\n", (err) => {
    if (err) {
      console.error("Error saving to CSV:", err);
    }
  });
}

async function sendActiveWindowInfo() {
  try {
    const activeWindowInfo = await activeWin();
    const currentTime = new Date().toLocaleString();
    // Extract only the application name from the owner property
    const applicationName = activeWindowInfo.owner.name.split(" - ")[0];
    const data = `${currentTime},${applicationName}`;
    saveToCSV(data);
    mainWindow.webContents.send("activeWindow", data); // Send active window data to mainWindow
  } catch (error) {
    console.error("Error retrieving active window:", error);
  }
}

function loadTimelineData() {
  fs.readFile(csvFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading CSV file:", err);
      return;
    }
    console.log("Data from CSV:", data);
    mainWindow.webContents.send("activeWindow", data); // Send CSV data to mainWindow
  });
}

app.on("ready", () => {
  createWindow();

  // Send active window information every second
  setInterval(sendActiveWindowInfo, 1000);

  // Handle request to load timeline data
  ipcMain.on("loadTimeline", () => {
    loadTimelineData();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});
