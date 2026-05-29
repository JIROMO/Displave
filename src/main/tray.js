const { Tray, Menu, nativeImage, app, dialog } = require("electron");
const path = require("path");
const { execSync } = require("child_process");
const { getLayouts, saveLayout, deleteLayout } = require("./layouts");
const { captureCurrentWindows, restoreLayout } = require("./windows");
const {
  checkAccessibilityPermission,
  requestAccessibilityPermission,
} = require("./permissions");

const isJa = app.getLocale().startsWith("ja");
const t = {
  appName: isJa ? "Displave" : "Displave",
  saveLayout: isJa ? "配置を保存" : "Save Layout",
  noLayouts: isJa ? "保存済みレイアウトなし" : "No saved layouts",
  apply: isJa ? "適用" : "Apply",
  delete: isJa ? "削除" : "Delete",
  checkPermissions: isJa ? "権限チェック" : "Check Permissions",
  quit: isJa ? "終了" : "Quit",
  inputPrompt: isJa ? "レイアウト名を入力" : "Enter layout name",
  inputDefault: isJa ? "例: 開発モード" : "e.g. Dev Mode",
  inputSave: isJa ? "保存" : "Save",
  inputCancel: isJa ? "キャンセル" : "Cancel",
  noWindowsMsg: isJa ? "ウィンドウを取得できませんでした" : "No windows found",
  noWindowsDetail: isJa
    ? "アクセシビリティ権限が付与されているか確認してください。"
    : "Make sure accessibility permissions are granted.",
  savedMsg: (name) => (isJa ? `「${name}」を保存しました` : `"${name}" saved`),
  savedDetail: (n) =>
    isJa
      ? `${n} 個のウィンドウを記録しました。`
      : `${n} window${n === 1 ? "" : "s"} captured.`,
  deleteConfirm: (name) =>
    isJa ? `「${name}」を削除しますか？` : `Delete "${name}"?`,
  deleteBtn: isJa ? "削除" : "Delete",
  cancelBtn: isJa ? "キャンセル" : "Cancel",
  permOkMsg: isJa
    ? "アクセシビリティ権限が有効です"
    : "Accessibility permission is enabled.",
  ok: "OK",
};

class TrayManager {
  constructor() {
    this.tray = null;
  }

  init() {
    this.tray = new Tray(this.createIcon());
    this.tray.setToolTip("Displave");
    this.rebuildMenu();
  }

  createIcon() {
    try {
      const iconPath = path.join(__dirname, "../../assets/tray-icon.png");
      const img = nativeImage.createFromPath(iconPath);
      img.setTemplateImage(true);
      return img;
    } catch {
      return nativeImage.createEmpty();
    }
  }

  updateIcon() {
    this.tray?.setImage(this.createIcon());
  }

  rebuildMenu() {
    const layouts = getLayouts();

    const layoutItems =
      layouts.length > 0
        ? layouts.map((layout) => ({
            label: layout.name,
            submenu: [
              {
                label: t.apply,
                click: () => this.handleApply(layout),
              },
              { type: "separator" },
              {
                label: t.delete,
                click: () => this.handleDelete(layout),
              },
            ],
          }))
        : [{ label: t.noLayouts, enabled: false }];

    const menu = Menu.buildFromTemplate([
      { label: t.appName, enabled: false },
      { type: "separator" },
      {
        label: t.saveLayout,
        accelerator: "CmdOrCtrl+Shift+S",
        click: () => this.handleSave(),
      },
      { type: "separator" },
      ...layoutItems,
      { type: "separator" },
      {
        label: t.checkPermissions,
        click: () => this.handleCheckPermissions(),
      },
      { type: "separator" },
      { label: t.quit, role: "quit" },
    ]);

    this.tray.setContextMenu(menu);

    this.tray.on("click", () => {
      this.tray.popUpContextMenu();
    });
  }

  async handleSave() {
    if (!checkAccessibilityPermission()) {
      requestAccessibilityPermission();
      return;
    }

    const name = nativeInputDialog(t.inputPrompt, t.inputDefault);
    if (!name) return;

    const windows = await captureCurrentWindows();
    if (windows.length === 0) {
      dialog.showMessageBoxSync({
        type: "warning",
        title: "Displave",
        message: t.noWindowsMsg,
        detail: t.noWindowsDetail,
        buttons: [t.ok],
      });
      return;
    }

    saveLayout(name, windows);
    this.rebuildMenu();

    dialog.showMessageBoxSync({
      type: "info",
      title: "Displave",
      message: t.savedMsg(name),
      detail: t.savedDetail(windows.length),
      buttons: [t.ok],
    });
  }

  async handleApply(layout) {
    await restoreLayout(layout.windows);
  }

  handleDelete(layout) {
    const result = dialog.showMessageBoxSync({
      type: "question",
      title: "Displave",
      message: t.deleteConfirm(layout.name),
      buttons: [t.deleteBtn, t.cancelBtn],
      defaultId: 1,
      cancelId: 1,
    });

    if (result === 0) {
      deleteLayout(layout.id);
      this.rebuildMenu();
    }
  }

  handleCheckPermissions() {
    if (checkAccessibilityPermission()) {
      dialog.showMessageBoxSync({
        type: "info",
        title: "Displave",
        message: t.permOkMsg,
        buttons: [t.ok],
      });
    } else {
      requestAccessibilityPermission();
    }
  }
}

function nativeInputDialog(prompt, defaultAnswer = "") {
  try {
    const escaped = defaultAnswer.replace(/"/g, '\\"');
    const result = execSync(
      `osascript -e 'display dialog "${prompt}" default answer "${escaped}" with title "Displave" buttons {"${t.inputCancel}", "${t.inputSave}"} default button "${t.inputSave}"'`,
      { encoding: "utf8", timeout: 60000 },
    ).trim();

    const match = result.match(/text returned:(.*)/);
    const name = match ? match[1].trim() : "";
    return name || null;
  } catch {
    return null;
  }
}

module.exports = { TrayManager };
