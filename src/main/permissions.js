const { systemPreferences } = require('electron')

function checkAccessibilityPermission() {
  if (process.platform !== 'darwin') return true
  return systemPreferences.isTrustedAccessibilityClient(false)
}

function requestAccessibilityPermission() {
  if (process.platform !== 'darwin') return true
  return systemPreferences.isTrustedAccessibilityClient(true)
}

module.exports = { checkAccessibilityPermission, requestAccessibilityPermission }
