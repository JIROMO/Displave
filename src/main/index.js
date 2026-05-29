const { app, nativeTheme } = require("electron");
const { TrayManager } = require("./tray");
const {
  checkAccessibilityPermission,
  requestAccessibilityPermission,
} = require("./permissions");

app.setName("Displave");
app.dock?.hide();

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let trayManager;

app.whenReady().then(() => {
  trayManager = new TrayManager();
  trayManager.init();

  if (!checkAccessibilityPermission()) {
    requestAccessibilityPermission();
  }
});

app.on("window-all-closed", (e) => {
  e.preventDefault();
});

nativeTheme.on("updated", () => {
  trayManager?.updateIcon();
});
