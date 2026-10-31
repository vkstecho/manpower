# Man Power landing videos — scripts & language guide

## Language: English, Hindi, or both?

| Audience | Recommended |
|----------|-------------|
| Plant managers / supervisors (India) | **Hinglish** (best default) |
| Floor operators who prefer Hindi only | **Hindi** + English on-screen labels |
| Corporate / multi-city HO buyers | **English** (or English with Hindi subtitles) |

**Practical recommendation:** Shoot **one Hinglish long video** (your natural voice) and a **short Hinglish or silent-demo short**.  
Add English captions on both. Optional second take in pure English later.

Hinglish works because buyers say “Excel”, “shift”, “coverage”, “login” in English already.

---

## 1) Short video — “Magical Auto Schedule in one click”
**Length:** 45–90 seconds  
**Goal:** Wow moment for landing page + WhatsApp/ads  
**Tone:** Fast, visual, minimal talk

### Shot list
1. (3s) Title card: *Auto Schedule · One click*
2. (8s) Screen: team list / Excel already loaded
3. (5s) Finger/cursor taps **Auto Schedule**
4. (15s) Grid fills D / N / O across the week (speed up if needed)
5. (15s) Coverage modal: green OK + one “short” → fix weekly off → re-run → OK
6. (10s) Phone: “My Shift” view for a member
7. (8s) End card: *Man Power · Start free · manpower.vkstech.com*

### Voice (Hinglish, optional — can be music-only)
> “Pehle Excel. Phir Auto Schedule. Ek click.  
> Section, machine — coverage check.  
> Gap dikha, weekly off badlo, phir se generate.  
> Man Power. Plant ke liye shift system.”

### English-only VO
> “Your Excel. One click. Auto Schedule.  
> Coverage checked by section and machine.  
> Gaps fixed before the shift starts.  
> Man Power — plant shift scheduling.”

---

## 2) Long video — Setup + free 15-day offer
**Length:** 4–8 minutes  
**Goal:** Trust + teach setup + convert to trial  
**Your hook (use as opening):**

> “I am ready to manage your shift schedule for free for 15 days.  
> Uske baad agar mera kaam achha lage, to continue rakhna.  
> Details main bata deta hoon.”

### Structure

| Time | Section | What to say / show |
|------|---------|---------------------|
| 0:00–0:25 | **Hook** | Your free-15-days line (above). Smile, face to camera. |
| 0:25–0:50 | **Problem** | “Har week Excel, WhatsApp, ‘kaun D pe hai?’ — coverage last moment pe toot-ti hai.” |
| 0:50–1:20 | **Promise** | “Man Power Excel se team leta hai, Auto Schedule karta hai, section/machine coverage check karta hai. Full HRMS nahi — plant roster tool hai.” |
| 1:20–2:20 | **Setup 1 — Login & team** | Mobile OTP login → manager. Upload / show Excel columns: section, machine, responsibility, designation, weekly off. |
| 2:20–3:10 | **Setup 2 — Members** | Member joins → pending → approve with emp code / section / machine → appears on schedule. |
| 3:10–4:40 | **Auto Schedule demo** | Open schedule → Auto Schedule → show fill → coverage modal → short group → change weekly off → regenerate → OK. |
| 4:40–5:20 | **Daily use** | My Shift on phone, mark OD/leave, offline note if relevant. |
| 5:20–6:20 | **Offer detail** | “15 din free — poora setup, Auto Schedule, coverage. Pasand aaye to continue. Pricing / plan details yahan (show screen or say contact).” |
| 6:20–end | **CTA** | “Link description / manpower.vkstech.com. Main yahin hoon setup ke liye.” |

### Closing line (Hinglish)
> “Pehle 15 din meri zimmedari.  
> Kaam sahi lage to aage badha dena.  
> Man Power — VKS Tech.”

### English closing
> “First 15 days on us.  
> If the roster works for your plant, continue.  
> Man Power by VKS Tech.”

---

## Landing page embeds

In `index.html`, find the two `.video-frame` blocks under `#videos`.

Replace each placeholder with:

```html
<iframe
  src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
  title="Man Power Auto Schedule"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  loading="lazy"></iframe>
```

Or self-host:

```html
<video controls playsinline poster="poster.jpg">
  <source src="videos/auto-schedule-short.mp4" type="video/mp4" />
</video>
```

---

## Filming tips
- Record screen (app) + small face cam for long video.
- Short video: mostly screen; big tap on Auto Schedule; end logo.
- Keep plant words: section, machine, D/N/O, coverage, weekly off.
- Add burned-in **English captions** even on Hinglish audio.
'''
