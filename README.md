# Options Please

A clue-based deduction game where you play as a financial advisor. Analyze market reports, news headlines, and word-of-mouth tips to recommend trading options (CALL, PUT, or HOLD) to your clients.

Each day you'll evaluate multiple clients based on the evidence they bring to your desk. Your recommendations will be judged on accuracy and performance, with feedback provided at the end of each day to track your advisory success.

## About

Won first place at the 2025 NKU-Fidelity 24-hackathon. Users were prompted to build any product that teaches stock options to users. 

Check out a blog post sharing more about our development process [HERE](https://www.tyleregloff.com/blog.html?post=hackathon.md)

Also, see the half-baked documentation that we constructed mid-hackathon to help guide GPT-4.0 to build the backbone of our app [HERE](https://github.com/HackathonFidelity2025/Documentation)

## Technical Specifications

### Tech Stack

- [Phaser 3.90.0](https://github.com/phaserjs/phaser)
- [React 19.0.0](https://github.com/facebook/react)
- [Vite 6.3.1](https://github.com/vitejs/vite)

### Requirements

[Node.js](https://nodejs.org) is required to install dependencies and run scripts via `npm`.

### Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run dev` | Launch a development web server |
| `npm run build` | Create a production build in the `dist` folder |

### Running the Game

After cloning the repo, run `npm install` from your project directory. Then, start the local development server:

```bash
npm run dev
```

The development server runs on `http://localhost:8080` by default. Once running, the game will automatically reload as you edit files in the `src` folder.

To create a production-ready build, run `npm run build`. The compiled game will be in the `dist` folder.
