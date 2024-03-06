const { app, BrowserWindow, ipcMain, Tray } = require("electron");
const fs = require("fs");
const path = require("path");
const activeWin = require("active-win");
const { MongoClient } = require("mongodb");

const mongodbUrl = "mongodb://localhost:27017"; // Change this to your MongoDB connection string
const dbName = "activity_tracker"; // Change this to your MongoDB database name
const collectionName = "activity"; // Change this to your collection name

function getFormattedDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}
// Connect to MongoDB
let db;
(async function connectToMongoDB() {
  try {
    const client = new MongoClient(mongodbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db(dbName);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
})();

let mainWindow;

// Get current date
const currentDate = new Date();
// Format current date in mm-dd-yyyy format
const formattedDate = getFormattedDate(currentDate);

let csvFilePath = `activity_${formattedDate}.csv`;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: "logo.png",
  });

  mainWindow.maximize();
  mainWindow.loadFile("index.html");
  mainWindow.on("closed", function () {
    mainWindow = null;
  });
  console.log("Window created.");
}

function saveToCSV(data) {
  const currentTime = new Date();
  let hours = currentTime.getHours();
  if (hours < 10) {
    hours = `0${hours}`;
  }
  const minutes = String(currentTime.getMinutes()).padStart(2, "0"); // Add leading zero if minute is a single digit
  const seconds = String(currentTime.getSeconds()).padStart(2, "0"); // Add leading zero if second is a single digit

  const formattedTime = `${hours}:${minutes}:${seconds}`;
  const formattedData = `${formattedTime},${data}`;

  fs.appendFile(csvFilePath, formattedData + "\n", (err) => {
    if (err) {
      console.error("Error saving to CSV:", err);
    } else {
      console.log("Data successfully saved to CSV.");
      console.log("Saved data:", formattedData);
    }
  });
}
function saveToMongoDB(dateTime, application) {
  if (!db) {
    console.error("MongoDB connection not established");
    return;
  }

  // Split the date and time
  const [date, time] = dateTime.split(", ");

  // Create a JavaScript object with properties for date, time, and application
  const document = { date, time, application };

  // Insert the document into the MongoDB collection
  db.collection(collectionName).insertOne(document, (err, result) => {
    if (err) {
      console.error("Error saving to MongoDB:", err);
    } else {
      console.log("Data successfully saved to MongoDB.");
    }
  });
}

async function sendActiveWindowInfo() {
  try {
    const activeWindow = await activeWin();
    // console.log("Active Window:", activeWindow);
    const currentTime = new Date().toLocaleString();
    const applicationName = activeWindow.owner.name.split(" - ")[0];

    const data = `${currentTime},${applicationName}`;
    saveToCSV(data);
    // Save to MongoDB
    saveToMongoDB(currentTime, applicationName);
    mainWindow.webContents.send("activeWindow", data);
    console.log("Active window information sent to renderer.");
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
    const lines = data.trim().split("\n");
    const activities = lines.map((line) => {
      const [time, application] = line.split(","); // Adjust for the correct position of time and application
      return { time, application };
    });

    mainWindow.webContents.send("loadTimelineData", activities);
    console.log("Timeline data loaded successfully.");
  });
}

app.on("ready", () => {
  createWindow();
  console.log("App is ready.");

  const appIcon = new Tray("logo.png");
  console.log("Tray icon created.");

  setInterval(sendActiveWindowInfo, 1000);

  ipcMain.on("loadTimeline", () => {
    loadTimelineData();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
    console.log("App closed.");
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
    console.log("Window recreated.");
  }
});
