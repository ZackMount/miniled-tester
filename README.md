# MiniLED Tester

A lightweight web-based tool for testing MiniLED display backlight behaviour: local dimming zones, HDR brightness steps, blooming (halo) detection, and black-level uniformity.

## Features

- **Zone grid**  
  Visualise a theoretical backlight zone layout (presets for common zone counts such as 576, 1152, 2304, 2596, or custom columns x rows). The grid is for reference only; real hardware zone geometry may differ.

- **Zone scan animation**  
  Horizontal, vertical, or single-zone sweep to observe local dimming response.

- **HDR brightness steps**  
  Step pattern using PQ-encoded AVIF images for nominal brightness from 0 to 10000 nits. Presets include SDR range, DisplayHDR 400/600/1000/1400, and custom comma-separated nits. Optional window size (e.g. 1% window) for peak brightness testing.

- **Blooming test**  
  Bright shapes (circle, square, cross) on a black background, with optional simulated glow and auto bounce, to check halo and blooming.

- **Starfield test**  
  Animated starfield for black-level and uniformity checks; star count, size, speed, and twinkle rate are configurable.

- **Scene HDR**  
  Optional HDR highlight (configurable nits) for grid, animation, blooming, and starfield elements to stress local dimming.

## Requirements

- Modern browser with HDR support (e.g. Chrome 120+, Edge) for true HDR; the app still runs in SDR.
- Fullscreen recommended for accurate visual assessment.

## Quick Start

Try MiniLED Tester online without deployment:
https://miniledtester.zackmount.blog/

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For production:

```bash
npm run build
npm start
```

## Tech stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS
- Icons: [Bootstrap Icons](https://icons.getbootstrap.com/) via `react-icons` (MIT)

## License

MIT.

## Author

ZackMount – [GitHub](https://github.com/ZackMount)
