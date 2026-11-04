# Deploy publicOffer rules (fixes "Publish failed")

Project: **metpowervks**

1. Open Firebase Console → Realtime Database → **Rules**
2. Merge / paste the `publicOffer` block from `database.rules.json`:

```json
"publicOffer": {
  ".read": true,
  ".write": "auth != null",
  ".validate": "newData.hasChildren(['updatedAt'])"
}
```

3. Click **Publish**
4. In Man Power Admin, open Payment settings → **Publish to landing page** again

`.read: true` = landing page can load prices without login  
`.write: auth != null` = any signed-in Admin/user session can publish
