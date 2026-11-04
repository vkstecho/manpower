# Landing videos — Admin (4 URLs)

Hard-admin phone **8929397949** sets videos in **Payment settings**.

## Four URLs
| Field | When shown |
|-------|------------|
| **EN · Short** | Landing language = English |
| **EN · Long** | Landing language = English |
| **HI · Short** | Landing language = Hindi (falls back to EN short if empty) |
| **HI · Long** | Landing language = Hindi (falls back to EN long if empty) |

Optional titles per language.

## Steps
1. Login as **8929397949**
2. Profile / Admin → **Payment settings**
3. **🎬 Landing videos — 4 URLs**
4. Paste YouTube / youtu.be / MP4 links
5. **💾 Save payment settings**
6. **📣 Publish to landing page**

## Firebase
- `settings/landingVideos`: `shortUrl`, `longUrl`, `shortUrlHi`, `longUrlHi`, titles…
- `publicOffer` after Publish: `videoShortUrl`, `videoLongUrl`, `videoShortUrlHi`, `videoLongUrlHi`, …

## Landing behaviour
- Language toggle **EN / हिं** switches copy **and** which video URLs load.
- If HI URL is blank, EN URL is used.
