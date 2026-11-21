# 🍽️ RePlate — Rescue the Surplus

**No edible food should reach a dustbin while someone nearby is hungry.**

**🔴 Live demo: https://replate-pi.vercel.app** · Repo: https://github.com/UG-SIDHARTH/hackaton

**🎬 Demo video (55 sec):** [▶ Watch the walkthrough](https://github.com/UG-SIDHARTH/hackaton/blob/main/replate_demo_video.mp4) — receiver feed → map → claim → pickup → impact → donor posting, recorded from the live site.

Run it locally with Docker: `docker compose up --build` → http://localhost:3000

RePlate is a real-time, mobile-first surplus food rescue platform. Restaurants, bakeries, supermarkets and caterers post food that would otherwise be thrown away; nearby NGOs, shelters, community kitchens and volunteers see it live, claim it in one tap, and pick it up before the deadline.

## 🎬 Try it in 60 seconds (no signup)

```bash
npm install
npm run dev
```

1. Tap **▶ Demo as Receiver** — claim the "Fresh Fruit Boxes" listing (red countdown, expiring soonest), see the donor's phone number, tap **Picked up ✓**.
2. Log out (top right), tap **▶ Demo as Donor** — post a listing from **＋ Post** (one screen: pick a photo, name it, tick the food-safety box, Post). It appears in the receiver feed instantly.
3. Open a second browser tab to watch the "real-time" sync: post in one tab, it appears in the other; claim it in one, it disappears in the other.

Demo accounts (password `demo` for both): `donor@replate.demo`, `receiver@replate.demo`. Seed data covers Thiruvananthapuram, Kerala; deadlines are relative to *now*, so the demo is alive whenever you run it.

## ✨ Features

- **Roles & auth** — signup/login with role selection (Donor / Receiver); receivers set a pickup radius (default 5 km). Role-based navigation.
- **Donor flow** — post food in under 30 seconds on one screen: photo (preset, or camera/upload compressed in-browser before saving), servings stepper, veg/non-veg toggle, location, deadline chips (1h / 2h / 4h / custom), mandatory food-safety confirmation. My Listings with live status and cancel.
- **Receiver flow** — live feed + Leaflet/OpenStreetMap map toggle, sorted by urgency (then distance) or nearest-first; filters for veg-only and minimum servings; colour-coded urgency (green > 2h, amber < 2h, red < 30 min); live per-second countdowns; listings auto-expire at deadline.
- **Claim loop** — one-tap claim reveals donor contact + address, Call donor (tel:) and Directions (Google Maps) links, cancel claim, and Mark Picked Up on both sides.
- **Notifications** — in-app toasts + notification bell; browser Notification API used where permitted. "Simulate new donation" button shows the receiver notification path live.
- **Impact dashboard** — animated counters (meals rescued, kg saved, CO₂ avoided, active donors), weekly rescues chart, top-donor leaderboard.

## 🏗️ Architecture

One data interface, two backends (`src/data/store.js`):

| Mode | When | How |
| --- | --- | --- |
| **Mock (default)** | No keys needed — the demo just works | `localStorage` + event bus; `storage` events sync tabs in the same browser in real time |
| **Firebase** | Add keys in `.env` | Firebase Auth + Firestore real-time listeners + Storage; claims use a Firestore transaction so two receivers can never double-claim |

**Honest limitation:** in mock mode the atomic claim guarantee is per-browser (localStorage writes are synchronous, so two tabs can't double-claim, but two *devices* each have their own copy). Cross-device atomicity requires Firebase mode. Everything else — UI, flows, expiry, impact — behaves identically in both modes.

To enable Firebase: create a project at console.firebase.google.com, enable Auth (email/password), Firestore and Storage, copy the web config into `.env` as `VITE_FIREBASE_*` variables, and swap the store implementation for Firestore `onSnapshot` listeners behind the same function signatures exported from `src/data/store.js`.

## 🛠️ Tech

React + Vite + Tailwind CSS · Leaflet + OpenStreetMap (no API key) · Browser Geolocation API with fallback to the Thiruvananthapuram city centre · In-app toasts + Notification API.

## 📐 Assumptions

- **Food safety:** donors confirm at posting time that food is freshly prepared / safely stored and fit to eat; receivers inspect at pickup. RePlate is a connector, not a food inspector.
- **Estimates:** 1 serving ≈ 0.4 kg of food ≈ 1 kg CO₂e avoided by diverting from landfill.
- Distances are straight-line (haversine); Directions links hand off to Google Maps for real routing.
- Build priority followed: core loop (post → feed → claim → pickup) first, then map, notifications, dashboard, leaderboard.

## 📁 Structure

```
src/
  data/store.js        data layer (mock backend + demo seed)
  components/ui.jsx    countdowns, urgency colours, listing card, toasts
  components/MapView.jsx  Leaflet map with urgency-coloured pins
  pages/Auth.jsx       login / signup / one-tap demo
  pages/PostFood.jsx   donor posting (single screen)
  pages/Feed.jsx       receiver live feed + filters
  pages/DonorPages.jsx My Listings / My Claims
  pages/Dashboard.jsx  impact counters, chart, leaderboard
```
