# Changelog

## 2026-10-18 — Low-quality JPEG attachment downloads

- `GET /api/v1/attachment/:guid/download?maxSize=N` returns a JPEG whose longest side is at most N,
  made with `/usr/bin/sips -Z N -s format jpeg -s formatOptions 70`. It keeps the EXIF orientation
  tag and is cached per size. The reply carries `X-BB-Resized: N` (`attachmentRouter.ts`,
  `FileSystem.resizeToJpg`, validator `maxSize: integer|min:1`).
- Images that already fit go out unchanged with no header, because `sips -Z` can enlarge. GIFs and
  `original=true` are not resized. `maxSize` takes precedence over the old `width`/`height`/`quality`
  resize, which returns a PNG and drops EXIF orientation (Electron `nativeImage`).
- Checked on the Mac mini against real attachments: a portrait HEIC went from 2635 KB to a 203 KB,
  1280×960 JPEG with `Rotate 90 CW` kept; a PNG went from 2726 KB to 352 KB; `maxSize=abc` returns 400.
- Deployed to the Mac mini (192.168.0.105) by replacing `app.asar`, `app.asar.unpacked` and
  `Info.plist` in `/Applications/BlueBubbles.app`. The main executable's CDHash was unchanged, so
  macOS permissions were kept. The previous files are in `~/bb-build/backup-tapbacks-20261018/`.
