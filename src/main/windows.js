const { execFileSync } = require("child_process");
const { screen } = require("electron");

// windowIndex: 1 = frontmost, higher = further back
const CAPTURE_SCRIPT = `
tell application "System Events"
  set windowList to {}
  set processList to every process whose background only is false and visible is true
  repeat with proc in processList
    set appName to name of proc
    set bundleId to bundle identifier of proc
    try
      set procWindows to every window of proc
      set winCount to count of procWindows
      repeat with i from 1 to winCount
        set win to item i of procWindows
        try
          set winTitle to name of win
          set winPos to position of win
          set winSize to size of win
          set winX to item 1 of winPos
          set winY to item 2 of winPos
          set winW to item 1 of winSize
          set winH to item 2 of winSize
          if winW > 50 and winH > 50 then
            set windowList to windowList & {appName & "|" & (bundleId as string) & "|" & winTitle & "|" & winX & "|" & winY & "|" & winW & "|" & winH & "|" & i}
          end if
        end try
      end repeat
    end try
  end repeat
  return windowList
end tell
`;

// Build an AppleScript to apply saved positions/sizes for all windows of one app.
// Matches by title first; falls back to index if the title has changed.
function buildRestoreScript(appName, appWindows) {
  const escapedApp = appName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  // Position/size blocks per window
  const windowBlocks = appWindows
    .map((win, listIdx) => {
      const escapedTitle = (win.windowTitle || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
      return `
  -- Window ${listIdx + 1}: "${escapedTitle}"
  set targetWin to missing value
  repeat with w in wins
    if name of w is "${escapedTitle}" then
      set targetWin to w
      exit repeat
    end if
  end repeat
  if targetWin is missing value and (count of wins) >= ${listIdx + 1} then
    set targetWin to item ${listIdx + 1} of wins
  end if
  if targetWin is not missing value then
    set position of targetWin to {${win.x}, ${win.y}}
    set size of targetWin to {${win.width}, ${win.height}}
  end if`;
    })
    .join("\n");

  // Z-order: set index from back to front so frontmost ends up on top
  const sortedByIndex = [...appWindows].sort(
    (a, b) => (a.windowIndex || 1) - (b.windowIndex || 1),
  );
  const zOrderBlocks = sortedByIndex
    .map((win) => {
      const escapedTitle = (win.windowTitle || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
      return `
  repeat with w in wins
    if name of w is "${escapedTitle}" then
      set index of w to 1
      exit repeat
    end if
  end repeat`;
    })
    .reverse()
    .join("\n");

  return `
tell application "System Events"
  set proc to first process whose name is "${escapedApp}"
  set wins to every window of proc
  if (count of wins) > 0 then
${windowBlocks}
${zOrderBlocks}
  end if
end tell
`;
}

function buildLaunchScript(appName, bundleId) {
  if (bundleId && bundleId !== "missing value") {
    return `tell application id "${bundleId}" to activate`;
  }
  const escaped = appName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `tell application "${escaped}" to activate`;
}

function runAppleScript(script) {
  execFileSync("/usr/bin/osascript", ["-e", script], {
    encoding: "utf8",
    timeout: 30000,
  });
}

function getScreenIndex(x, y, displays) {
  for (let i = 0; i < displays.length; i++) {
    const { bounds } = displays[i];
    if (
      x >= bounds.x &&
      x < bounds.x + bounds.width &&
      y >= bounds.y &&
      y < bounds.y + bounds.height
    ) {
      return i + 1;
    }
  }
  return 1;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureCurrentWindows() {
  try {
    const result = execFileSync("/usr/bin/osascript", ["-e", CAPTURE_SCRIPT], {
      encoding: "utf8",
      timeout: 15000,
    }).trim();

    if (!result) return [];

    const displays = screen.getAllDisplays();

    return result
      .split(", ")
      .map((line) => {
        const parts = line.split("|");
        if (parts.length < 7) return null;

        const [appName, bundleId, windowTitle, xStr, yStr, wStr, hStr, idxStr] =
          parts;
        const x = parseInt(xStr, 10);
        const y = parseInt(yStr, 10);
        const width = parseInt(wStr, 10);
        const height = parseInt(hStr, 10);
        const windowIndex = parseInt(idxStr, 10) || 1;

        if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) return null;

        return {
          appName: appName.trim(),
          bundleId: bundleId.trim(),
          windowTitle: windowTitle.trim(),
          x,
          y,
          width,
          height,
          windowIndex,
          screen: getScreenIndex(x, y, displays),
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error("Failed to capture windows:", err);
    return [];
  }
}

async function restoreLayout(windows) {
  // Group by app — launch once, apply all windows together
  const appMap = new Map();
  for (const win of windows) {
    const key =
      win.bundleId && win.bundleId !== "missing value"
        ? win.bundleId
        : win.appName;
    if (!appMap.has(key)) appMap.set(key, { win, windows: [] });
    appMap.get(key).windows.push(win);
  }

  for (const [, { win: firstWin, windows: appWindows }] of appMap) {
    try {
      runAppleScript(buildLaunchScript(firstWin.appName, firstWin.bundleId));
      await sleep(600);
      runAppleScript(buildRestoreScript(firstWin.appName, appWindows));
    } catch (err) {
      console.error(`Failed to restore ${firstWin.appName}:`, err.message);
    }
  }
}

module.exports = { captureCurrentWindows, restoreLayout };
