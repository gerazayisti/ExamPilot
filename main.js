const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function resetDatabase() {
    const dbPath = path.join(__dirname, 'prisma', 'dev.db');
    const firstRunFlag = path.join(app.getPath('userData'), 'first-run-complete');

    // Check if this is the first run
    if (!fs.existsSync(firstRunFlag)) {
        console.log('First run detected. Resetting database...');

        // Delete the database if it exists
        if (fs.existsSync(dbPath)) {
            try {
                fs.unlinkSync(dbPath);
                console.log('Database deleted successfully.');
            } catch (err) {
                console.error('Error deleting database:', err);
            }
        }

        // Mark first run as complete
        try {
            fs.writeFileSync(firstRunFlag, new Date().toISOString());
            console.log('First run flag created.');
        } catch (err) {
            console.error('Error creating first run flag:', err);
        }
    }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'public/favicon.ico')
    });

    // Load the local Next.js server
    win.loadURL('http://localhost:3000');

    // Open the DevTools if needed
    // win.webContents.openDevTools();
}

app.whenReady().then(() => {
    // Reset database on first run
    resetDatabase();

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
