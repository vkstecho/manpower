# Landing videos — Admin (mobile 8929397949)

Hard-admin phone **8929397949** can set both marketing videos from the app.

## Steps
1. Login with OTP as **8929397949**
2. Open **Profile / Admin → Payment settings**
3. Scroll to **🎬 Landing videos**
4. Paste:
   - **Short video URL** — Auto Schedule one-click (YouTube / youtu.be / MP4)
   - **Long video URL** — Setup + free 15 days
   - Optional titles
5. Tap **💾 Save payment settings** (also saves videos)
6. Tap **📣 Publish to landing page**

## Where they appear
- App login screen (`#loginVideos` chips)
- Marketing page: `/landing/` (or `landing/index.html`) — auto-loads from `publicOffer`
- Firebase node: `settings/landingVideos` + published fields on `publicOffer`:
  - `videoShortUrl`, `videoLongUrl`, `videoShortTitle`, `videoLongTitle`

## Verify
```
https://metpowervks-default-rtdb.asia-southeast1.firebasedatabase.app/publicOffer.json
```
Should show `videoShortUrl` / `videoLongUrl` after Publish.
