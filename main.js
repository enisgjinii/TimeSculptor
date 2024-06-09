const { app, BrowserWindow } = require('electron');
const path = require('path');
const axios = require('axios');
const electronReload = require('electron-reload');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        }
    });
    // Remove the default menu
    // win.setMenu(null);
    win.loadFile('index.html');

    // Maximize the window to full screen
    win.maximize();

    setInterval(async () => {
        const { activeWindow } = await import('get-windows');
        const activeWinInfo = await activeWindow();
        if (activeWinInfo) {
            console.log(activeWinInfo.owner.name);
            console.log(activeWinInfo.url);
            // Send active window info to Express.js server
            try {
                await axios.post('http://localhost:3001/active-app', activeWinInfo);
                console.log('Data sent to server');
            } catch (error) {
                console.error('Error sending data to server:', error.message);
            }
            // Send active window info to renderer process
            win.webContents.send('active-app', activeWinInfo.owner.name);
        }
    }, 1000);
}

// Enable hot reload
electronReload(__dirname);

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
