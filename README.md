# Mental Math Challenge — Mobile App

An Android-focused mental arithmetic game built with React Native, Expo, and TypeScript.

The application challenges players through different question formats, configurable difficulty levels, timed challenges, and performance tracking. Player profiles, game history, settings, and rankings are stored locally on the device.

## Features

- Three game modes: Classic, True/False, and Multiple Choice.
- Easy, Medium, and Hard difficulty levels.
- Configurable number of questions per game.
- Time Attack mode with time bonuses and penalties.
- Dynamic Difficulty mode with progressively shorter response times.
- Scoring based on accuracy, response speed, and game configuration.
- Local player profiles with independent game histories.
- Rankings with filters by game mode, difficulty, and other settings.
- Performance statistics and visualizations.
- End-of-game summaries with individual answer details.
- Optional sound effects, background music, and haptic feedback.

Time Attack and Dynamic Difficulty are mutually exclusive modes.

## Tech Stack

- **React Native** — Mobile user interface.
- **Expo** — Application tooling and native integration.
- **TypeScript** — Application logic and typed data models.
- **AsyncStorage** — Local persistence of profiles, settings, and results.
- **Expo AV** — Sound effects and background music.
- **Expo Haptics** — Haptic feedback.
- **Android / Gradle** — Native Android project.

## Application Structure

The application is organized around:

- `src/screens/` — Login, settings, game configuration, gameplay, results, and statistics.
- `src/components/` — Shared interface components and charts.
- `src/context/` — Global application state and profile management.
- `src/utils/math.ts` — Mathematical question generation.
- `src/utils/scoring.ts` — Scoring and timing rules.
- `src/utils/storage.ts` — Local data persistence.
- `src/types.ts` — Application data models.
- `assets/` — Audio resources.
- `android/` — Native Android configuration.

The application source is located in the `mental-math-game/` directory.

## Getting Started

### Requirements

- A compatible Node.js LTS version.
- npm.
- Android Studio, Android SDK, and an Android emulator, or a compatible Android device.

### Installation

From the repository root:

```bash
cd mental-math-game
npm ci
```

### Running on Android

To build and launch the native Android development application:

```bash
npm run android
```

To start the Expo development server:

```bash
npm start
```

The Android emulator, development client, and native tooling must be configured appropriately.

The repository includes an Android native project; development-client compatibility may differ from Expo Go.

## Local Data and Privacy

The application does not require a backend or online account.

Profiles are identified by locally entered names. Game results, preferences, and rankings are stored on the device using AsyncStorage.

The rankings represent locally stored results, not an online multiplayer leaderboard.

## Project Scope

This is an educational mobile application focused on interactive gameplay, mathematical challenges, local persistence, and performance tracking.

It is not a cloud-connected gaming platform and does not require remote authentication or external database services.
