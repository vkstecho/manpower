# Firebase Storage rules — Man Power

## File
`storage.rules` — paste into Firebase Console → **Storage** → **Rules** → Publish

## Paths used by the app

| Path | Purpose |
|------|---------|
| `profilePhotos/{mobileOrUid}/avatar.jpg` | Profile photo (Profile → Edit) |
| `selfies/**` | Login / registration selfies |
| `reportPhotos/**` | Report / NCR images |

## Deploy

### Console
1. [Firebase Console](https://console.firebase.google.com) → project **metpowervks**
2. **Storage** → **Rules**
3. Paste contents of `storage.rules`
4. **Publish**

### CLI
```bash
firebase deploy --only storage
```

## Notes
- User must be signed in (`request.auth != null`) — OTP login satisfies this.
- Profile write is limited to **images under 5 MB**.
- Folder name should be the user’s **10-digit mobile** or Auth **uid** (app uses mobile key).

If profile upload fails with `storage/unauthorized`, publish these rules and ensure Storage is enabled for the project.
