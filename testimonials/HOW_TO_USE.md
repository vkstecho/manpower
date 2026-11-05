# Testimonials — How to use effectively (Man Power + other VKS Tech apps/websites)

This folder is designed to be **shared** across:
- Man Power landing page (`manpower.vkstech.com`)
- Mentor app / mentor.vkstech.com
- VKS Tech main website
- Any future product landing page under VKS Tech

---

## 1. Folder structure (keep it exactly like this)

```
testimonials/
├── Images/
│   ├── PersonName/
│   │   └── avatar.jpg          ← real photo (preferred)
│   │   └── avatar.png          ← alternative
│   │   └── avatar.svg          ← fallback graphic (auto-used if jpg/png missing)
│   └── placeholder-avatar.svg
├── htmls/
│   └── testimonials.html       ← self-contained preview + source of truth for quotes
├── HOW_TO_USE.md               ← this file
└── README.md
```

**Rule:** One folder per person. Photo name must be `avatar.jpg` or `avatar.png`.

---

## 2. Why this structure works for conversion

Buyers of plant software and career mentoring ask the same silent questions:

1. Are you genuine?
2. Have you helped someone like me?
3. What results did they get?

This folder answers all three with **real faces + real career paths** under VKS Tech mentoring.

- **Authority** → Vivek Kumar featured card (9 years, 60-member teams, concrete numbers)
- **Social proof** → Operators → Team Leaders → AMs → Senior Engineers who started under the same guidance
- **Path clarity** → Every card shows “Started as X → Now Y”

When the same testimonials appear on Man Power, Mentor, and the main website, trust compounds.

---

## 3. How to use on a landing page

### Option A — Embed the whole page (fastest)
```html
<iframe 
  src="/testimonials/htmls/testimonials.html" 
  style="width:100%;min-height:900px;border:0;"
  title="VKS Tech Testimonials"
  loading="lazy">
</iframe>
```

### Option B — Copy cards into your own landing (recommended for design control)
1. Open `htmls/testimonials.html`
2. Copy the `TESTIMONIALS` array (or the rendered card HTML)
3. Paste into your `index.html` under a `#testimonials` section
4. Keep image paths relative: `testimonials/Images/PersonName/avatar.jpg`

### Option C — JSON feed (for multiple sites)
You can later extract the array into `testimonials/data.json` and fetch it from any site so one update reaches Man Power + Mentor + website.

---

## 4. Adding a new testimonial (2 minutes)

1. Create folder: `Images/New_Person_Name/`
2. Drop photo as `avatar.jpg`
3. Add one object to the `TESTIMONIALS` array in `htmls/testimonials.html`:

```js
{
  id: 'newperson',
  name: 'Full Name',
  role: 'Current Designation',
  plant: 'Company · Location',
  stars: 5,
  path: 'Started as X → Now Y',
  quote: 'One or two honest sentences about the guidance / result.',
  imageFolder: 'New_Person_Name',
  featured: false
}
```

4. Refresh the page. Done.

---

## 5. Best practices for maximum sales impact

| Do | Don’t |
|----|-------|
| Keep quotes short and specific (role + result) | Generic “great training” praise |
| Show the career jump (Trainee → AM, GET → Senior Engineer) | Only current title |
| Put founder card first (authority) | Hide the person who built the system |
| Use real company names the buyer recognises (Uflex, Jindal, GLS, Chiripal, Sumilon) | Vague “a packaging company” |
| Same set of testimonials on every VKS Tech product | Different stories on each site (breaks trust) |

---

## 6. Current people (as of Nov 2026)

**Real photos present**
- Vivek Kumar (Founder / Production Manager HOD)
- Amit (Sr. Operator, Chiripal)
- Ankit (Operator, Jindal Nashik)
- Ajab Singh (AM Planning, Sumilon)
- N.K. Jena (Senior Engineer, Uflex Dharwad)
- Anuj (Team Leader, GLS)
- Dishant (Junior Engineer, GLS)
- Ghanshyam (Shift Leader, GLS Gurawara)
- Avinash

**Photos pending** (drop `avatar.jpg` when ready)
- Tarun Bhardwaj (Senior Editor, Rithora)
- Mohit (Senior Team Manager, Rithora)

**Additional**
- 3 realistic AI + career mentoring testimonials (placeholder avatars)

All mentoring is attributed to **VKS Tech** / `mentor.vkstech.com` or direct one-to-one sessions.

---

## 7. Team size note
All references to team size use **60 members** (updated from earlier 30).

---

## 8. Maintenance
- When a person changes company/role → update only the object in the array.
- Never delete a card that is already live on a landing page without replacing it (trust loss).
- Keep this folder in the root of the Man Power repo so other projects can submodule or copy it.

**Repo location recommendation**
```
manpower/
├── testimonials/          ← this folder
├── index.html             ← main landing (references testimonials)
├── app.html
└── ...
```
