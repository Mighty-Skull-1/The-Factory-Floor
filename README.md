# The Factory Floor 🏭⚡

> **The Binding of Isaac × Shapez × Pizza Tower**  
> A high-octane roguelike conveyor-crafting shooter with multi-stage boss battles, custom assembly weapons, and Mach-speed Meltdown escapes!

---

## 🎮 Overview

**The Factory Floor** is an action roguelike where you fight through industrial sectors, collect raw scrap and factory components, assemble modular weapons on an 8×8 conveyor grid, and trigger apocalyptic Core Meltdowns to escape before the facility collapses.

### 🌟 Key Features
* **Modular Conveyor Weapon Assembly**: Build custom blaster ammunition on an 8×8 factory grid using cutters, dye vats, stackers, mergers, and expanders.
* **14 to 18-Room Multi-Wing Facilities**: Sprawling multi-room floor layouts with branching logistics wings, side armories, and elite mini-boss chambers.
* **3-Stage Boss Battles**:
  * **Overseer Boss** (Steam Foundry): Slag Jet charges, dual-gatling fire, and berserk double-spiral firestorms.
  * **Volt Warden** (High-Voltage Grid): Lightning railgun z-dashes, revolving laser crosses, and EMP vortex shockwaves.
  * **Overlord Core** (Cyber Citadel): Orbiting satellite deflector plates, matrix sniper salvos, and black hole event horizon collapse.
* **Scrap Super & Overclock Arsenal**:
  * **`[Q]` Scrap Overdrive Bomb (20⚙)**: Destroys all enemy bullets, deals 120 area blast damage, grants 1.5s invulnerability, and activates 2× blaster fire rate & +45% move speed.
  * **Permanent Scrap Overclocks**: Invest scrap in Rusty's Workbench for Magnet Shrapnel, Conveyor Turbo, Reactive Plating, Sentry Buddy Drone, and Super Slide Slam.
* **Pizza Tower-Style Meltdown Escapes**:
  * Overload the reactor core and sprint back across the facility before time runs out.
  * Chain Mach 1–3 momentum, smash through cracked hazard barricades, and enter the **Lap 2 Portal** to retrieve the Golden Bell for the coveted **P-Rank**!
* **Multiple Game Modes**:
  * **Standard Mode**: 3-sector factory liberation campaign.
  * **Hard Mode**: Aggressive enemy squads, faster attack cycles, and elite reinforcements.
  * **Endless Mode**: Sprawling 16–18 room mega-gauntlets with deep vault bosses and endless sector loop scaling (+25% HP per loop).

---

## 🕹️ Controls

| Action | Controls |
| :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` or Arrow Keys |
| **Aim & Shoot** | Mouse Pointer + `Left Click` |
| **Mach Slide / Dash** | `Shift` or `Spacebar` |
| **Taunt / Bullet Parry** | `C` or `F` |
| **Scrap Overdrive Bomb** | `Q` or Click HUD Bomb Button (20⚙) |
| **Inventor Workbench (Crafting)** | `Tab` or `E` |
| **Pause Menu & Codex** | `Escape` or `P` |
| **Mute Audio** | `M` |

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* npm (bundled with Node.js)

### Installation & Run

1. Clone the repository:
   ```bash
   git clone git@github.com:Mighty-Skull-1/The-Factory-Floor.git
   cd The-Factory-Floor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:5173/`.

4. Build for production:
   ```bash
   npm run build
   ```

---

## 🛠️ Tech Stack
* **TypeScript** (Strict typing & modular OOP architecture)
* **Vite** (Next-gen frontend tooling & lightning-fast HMR)
* **HTML5 Canvas** (Custom 2D rendering engine with particle systems and screen shakes)
* **Web Audio API** (Procedural sound synthesis & music engine)
