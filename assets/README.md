# Assets

- `tray-icon.png` — 18×18px template image (black icon, transparent bg). macOS uses it as template image (auto light/dark).
- `icon.icns` — App icon for distribution build.

## tray-icon の作り方

1. 18×18px の PNG を用意（黒のシンプルなアイコン推奨）
2. `img.setTemplateImage(true)` で自動的にダーク/ライト対応になる

## icon.icns の作り方

```bash
mkdir icon.iconset
# 各サイズの PNG を icon.iconset/ に配置後:
iconutil -c icns icon.iconset -o icon.icns
```
