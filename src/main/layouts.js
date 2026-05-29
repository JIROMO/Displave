const Store = require("electron-store");
const { randomUUID } = require("crypto");

const store = new Store({
  name: "layouts",
  defaults: { layouts: [] },
});

function getLayouts() {
  return store.get("layouts", []);
}

function saveLayout(name, windows) {
  const layouts = getLayouts();
  const now = new Date().toISOString();

  const layout = {
    id: randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    windows,
  };

  store.set("layouts", [layout, ...layouts]);
  return layout;
}

function deleteLayout(id) {
  const layouts = getLayouts();
  const filtered = layouts.filter((l) => l.id !== id);
  if (filtered.length === layouts.length) return false;
  store.set("layouts", filtered);
  return true;
}

function getLayout(id) {
  return getLayouts().find((l) => l.id === id);
}

module.exports = { getLayouts, saveLayout, deleteLayout, getLayout };
