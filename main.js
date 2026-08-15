const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const userDataDir = app.getPath('userData');
const vaultDir = path.join(userDataDir, 'vault');
const indexFile = path.join(userDataDir, 'vault-index.json');

if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true });
if (!fs.existsSync(indexFile)) fs.writeFileSync(indexFile, JSON.stringify({ items: [] }, null, 2));

function readIndex() {
  return JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
}

function writeIndex(data) {
  fs.writeFileSync(indexFile, JSON.stringify(data, null, 2));
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

// Recursively copy then remove, so it also works across mounted volumes / iCloud
// where a plain rename can fail (EXDEV).
function moveSync(src, dest) {
  try {
    fs.renameSync(src, dest);
  } catch (err) {
    if (err.code === 'EXDEV') {
      fs.cpSync(src, dest, { recursive: true });
      fs.rmSync(src, { recursive: true, force: true });
    } else {
      throw err;
    }
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 640,
    minWidth: 420,
    minHeight: 560,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#191b20',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ---- IPC ----

ipcMain.handle('vault:list', () => {
  const data = readIndex();
  return data.items.map(({ id, label, lockedAt, originalPath }) => ({
    id,
    label,
    lockedAt,
    originalPath,
  }));
});

ipcMain.handle('vault:lock', (event, { folderPath, label, password }) => {
  if (!folderPath || !password) {
    return { ok: false, error: 'Missing folder or password.' };
  }
  if (!fs.existsSync(folderPath)) {
    return { ok: false, error: 'That folder no longer exists.' };
  }

  const data = readIndex();
  const id = crypto.randomUUID();
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const storedPath = path.join(vaultDir, id);

  try {
    moveSync(folderPath, storedPath);
  } catch (err) {
    return { ok: false, error: `Could not move folder: ${err.message}` };
  }

  data.items.push({
    id,
    label: label && label.trim() ? label.trim() : path.basename(folderPath),
    originalPath: folderPath,
    storedPath,
    salt,
    passwordHash,
    lockedAt: new Date().toISOString(),
  });
  writeIndex(data);

  return { ok: true, id };
});

ipcMain.handle('vault:unlock', async (event, { id, password }) => {
  const data = readIndex();
  const item = data.items.find((i) => i.id === id);
  if (!item) return { ok: false, error: 'Item not found.' };

  const candidateHash = hashPassword(password, item.salt);
  if (candidateHash !== item.passwordHash) {
    return { ok: false, error: 'Wrong password.' };
  }

  // Decide restore location: original spot if free, otherwise ask.
  let destination = item.originalPath;
  if (fs.existsSync(destination)) {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: `Choose where to restore "${item.label}"`,
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, error: 'Restore canceled.' };
    }
    destination = path.join(result.filePaths[0], path.basename(item.originalPath));
  }

  try {
    moveSync(item.storedPath, destination);
  } catch (err) {
    return { ok: false, error: `Could not restore folder: ${err.message}` };
  }

  data.items = data.items.filter((i) => i.id !== id);
  writeIndex(data);

  return { ok: true, destination };
});

ipcMain.handle('vault:choose-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});
