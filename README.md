# Pixel Space Assault

> **GAME FULLY AI-GENERATED**

Pixel Space Assault is a responsive pixel-art space shooter that runs directly
in the browser. Pilot your ship, destroy enemies, collect coins and upgrades,
and defeat a boss at the end of every level.

## Why This Game Exists

This game started as one of my completely spontaneous personal whims: I wanted
to turn a very specific childhood feeling into something playable. The goal was
to capture the vibe of Game Boy-era handheld games — chunky pixels, simple
controls, short action-packed sessions, and the kind of space shooter you could
pick up and understand immediately.

It is not trying to be a giant studio production. It is simply a nostalgic idea
I felt like bringing to life for fun. The concept and direction came from my
personal whim; the game implementation itself was fully AI-generated.

## Features

- 5 stages with 5 levels each, for a total of 25 levels.
- A boss fight at the end of every level.
- Increasing difficulty and three regular enemy types.
- HP, score, coins, and persistent high scores.
- Stackable upgrades: Multi Shot (`M`), Auto Aim (`A`), Rapid Fire (`R`),
  and Heal (`+`).
- A shop with Starting Weapons, Skins, and Support Ships.
- Item states: `LOCKED`, `OWNED`, and `EQUIPPED`.
- Statistics and shop progress saved with `localStorage`.
- A responsive Canvas with a fixed internal resolution of 800×600.

## Desktop Controls

- Arrow keys or `WASD`: move the ship.
- Spacebar: fire.
- Mouse: hold the button over the play area and move the pointer to steer and
  fire at the same time.
- `Escape`: return to the main menu.

## Mobile Controls

Hold your finger on the play area and drag it across the screen. The ship
follows your finger and keeps firing while the screen remains pressed. The game
uses Pointer Events, so the same input system supports a mouse, touchscreen,
and stylus.

## Project Structure

```text
pixel-space-assault/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── game.js
├── README.md
└── .gitignore
```

## Running Locally

Nothing needs to be installed or built. Open `index.html` in a modern web
browser.

Progress, statistics, and purchased items are stored locally for the address
where the game is running. Clearing the site's browser data will remove the
saved progress.

## Technology and Privacy

The project uses only HTML, CSS, vanilla JavaScript, and HTML Canvas. It does
not use external libraries, frameworks, CDNs, fonts, assets, APIs, or network
services. The game does not send player data outside the browser.

## GitHub Pages

The game can be published from GitHub without a build process:

1. Open `Settings` → `Pages` in the repository.
2. Select `Deploy from a branch`.
3. Select the project branch and the `/(root)` directory.
4. Save the settings and wait for the publication to finish.

## Future Features

- Functional effects for purchased weapons, skins, and support ships.
- More enemy types and bosses.
- Sound effects and music using original local assets.
- A settings screen and customizable controls.
- Pause support and gamepad controls.
- Improved visual effects, animations, and gameplay balance.
- Save-data export and import.
