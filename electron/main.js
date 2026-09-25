const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

// Same idea as capacitor.config.ts for the Android shell: this window is a
// thin native wrapper around the live, deployed Next.js admin panel — server
// actions, cookie-based session auth, and server-side Supabase queries all
// require a real Next.js server, so there is no offline/bundled build here.
// Keep this in sync with PRODUCTION_ADMIN_URL in capacitor.config.ts.
const PRODUCTION_ADMIN_URL = "https://redmuseum.vercel.app/admin";
const APP_ORIGIN = new URL(PRODUCTION_ADMIN_URL).origin;

// Only these schemes are ever handed to the OS. shell.openExternal() on an
// arbitrary URL (file:, smb:, custom protocol handlers…) can launch local
// programs, so anything else is dropped rather than opened.
const EXTERNAL_PROTOCOLS = new Set(["https:", "http:", "mailto:", "tel:"]);

function openExternalSafely(url) {
  try {
    if (EXTERNAL_PROTOCOLS.has(new URL(url).protocol)) shell.openExternal(url);
  } catch {
    // Unparseable URL — ignore.
  }
}

function isAppUrl(url) {
  try {
    return new URL(url).origin === APP_ORIGIN;
  } catch {
    return false;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    title: "Amna Suraka Admin",
    icon: path.join(__dirname, "build", "icon.ico"),
    autoHideMenuBar: true,
    backgroundColor: "#0b0a08",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadURL(PRODUCTION_ADMIN_URL);

  // Anything that would normally open a new browser tab (target="_blank",
  // window.open, external links) opens in the system browser instead of a
  // second app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafely(url);
    return { action: "deny" };
  });

  // Same-tab navigation (plain links, tel: links, redirects) may only stay
  // on the admin site itself; anything else goes to the system browser /
  // dialer instead of loading inside this privileged app window.
  win.webContents.on("will-navigate", (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    openExternalSafely(url);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
