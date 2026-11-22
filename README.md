# Snake Game 🐍

The classic arcade snake, right in your browser. Eat, grow, get faster — don't crash.

## Features

- Canvas snake on a 22×22 grid
- Steer with **arrow keys / WASD**, on-screen direction pad, or Space to pause
- Score (+10 per food) and high score saved in `localStorage`
- Speed increases with every food eaten (and a speed-level readout)
- Game over state with your final score and a Play again button

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

No build step, no dependencies except Google Fonts. Just open `index.html` or serve the folder.

## Deploy

Any static host works — GitHub Pages, Netlify, Vercel: publish this folder as-is.
