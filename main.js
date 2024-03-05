const { app, BrowserWindow, ipcMain, Tray } = require("electron");
const findProcess = require("find-process");
const fs = require("fs");
const path = require("path");
const activeWin = require("active-win");

function getFormattedDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

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
  const currentTime = new Date().toLocaleTimeString(); // Format current time properly
  const formattedData = `${currentTime},${data}`;
  fs.appendFile(csvFilePath, formattedData + "\n", (err) => {
    if (err) {
      console.error("Error saving to CSV:", err);
    } else {
      console.log("Data successfully saved to CSV.");
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
