const { app, BrowserWindow, ipcMain, Tray, clipboard } = require("electron");
const activeWin = require("active-win");
const fs = require("fs");

let mainWindow;
let csvFilePath = "activity.csv";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Required to use ipcRenderer
    },
    icon: "logo.png",
  });

  // Maximize the window to full-screen
  mainWindow.maximize();

  mainWindow.loadFile("index.html");

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

function saveToCSV(data) {
  fs.appendFile(csvFilePath, data + "\n", (err) => {
    if (err) {
      console.error("Error saving to CSV:", err);
    }
  });
}

async function sendActiveWindowInfo() {
  try {
    const activeWindow = await activeWin();
    const currentTime = new Date().toLocaleString();
    // Extract only the application name from the owner property
    const applicationName = activeWindow.owner.name.split(" - ")[0];
    const data = `${currentTime},${applicationName}`;
    saveToCSV(data);
    mainWindow.webContents.send("activeWindow", data);
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
    mainWindow.webContents.send("activeWindow", data);

    // Parse the CSV data and send it line by line
    const lines = data.split("\n");
    lines.forEach((line) => {
      mainWindow.webContents.send("activeWindow", line);
    });
  });
}

app.on("ready", () => {
  createWindow();

  // Create tray icon
  const appIcon = new Tray("logo.png");

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
