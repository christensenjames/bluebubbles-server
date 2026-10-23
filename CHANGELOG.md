# Changelog

## 2026-10-23 — Mac contact photos stored only as thumbnails

- `/api/v1/contact` dropped the photo of most iCloud contacts. node-mac-contacts returns
  `contactImage` as an empty buffer when only the thumbnail is stored locally, and the mapper's
  fallback read `contactImageThumbnail`, a key that library never sets (it uses
  `contactThumbnailImage`). Only 8 of 63 Mac photos reached the clients. The mapper now uses the
  thumbnail whenever the full image is empty (`contactInterface.ts`, `07d46acc`, branch
  `fix/contact-thumbnail-avatar`). After it, all 63 come through.
- Deployed to the Mac mini by swapping `app.asar`, `app.asar.unpacked` and `Info.plist` (same
  CDHash). The previous files are in `~/bb-build/backup-contactthumb-20261023/`.
- The server's cached Mac contacts had missed 32 contacts added that day; a server restart
  reloaded them.

## 2026-10-21 — Socket auth with a '%' in the password

- The socket connection handler ran `decodeURI` on the client's password before checking it. A
  password containing a literal `%` that is not an escape (such as `%zz`) made it throw `URIError`,
  so the handler stopped before the auth check, before `socket.disconnect()` and before
  `SocketRoutesV1.createRoutes`. The client stayed connected and got every broadcast event, but no
  request was ever answered: the app's 30 s `get-fcm-client` heartbeat got no ack and rebuilt the
  socket every 40 s, with an incremental sync and a full contact upload each time. The same hole let a
  client with a wrong password that contained a malformed `%` stay connected and receive events.
- The handler now compares both the raw password and, when it decodes, the `decodeURI` result
  (`server/api/http/index.ts`). A raw password that only looked like an escape (`%41`) also
  authenticates now; before, it was decoded to `A` and rejected.
- A rejected client now stops at the disconnect instead of also getting the route handlers. The
  handler rejects every client when the server has no password set, as the REST auth middleware
  already did; before, an empty client password matched an empty server password and an unset
  password matched the string `null`. Any other error while setting a client up is logged and
  disconnects it rather than leaving it connected with no routes. The password is read without an
  `await`, since `getConfig` is synchronous.
- Deployed to the Mac mini the same way as the 2026-10-18 build; the previous files are in
  `~/bb-build/backup-socketauth-20261021/`. Checked there: the server log shows `Client
  Authenticated Successfully` for the app, the app's heartbeat stopped missing, and a client sending
  `abc%zz` is disconnected.

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
