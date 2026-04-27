# Lifeloop — Personal AI Life OS

A multi-agent AI orchestrator that connects Amazon Music, Google Calendar, email, health data, smart home devices, and weather into a single unified intelligence layer. One place that knows your whole context.

## How it works

Lifeloop uses Google Genkit to coordinate a set of independent AI flows. Each flow owns one data domain. An orchestrator layer pulls from all of them, synthesises across the combined context, and surfaces morning summaries, intelligent daily suggestions, and mood-aware recommendations.

## AI flows

| Flow | What it does |
|------|-------------|
| `morning-summary` | Synthesises calendar, weather, health, and email into a daily briefing |
| `mood-detection` | Infers current mood from health signals, schedule density, and recent patterns |
| `intelligent-suggestions` | Cross-source suggestions based on full context |
| `calendar-events-flow` | Parses and structures calendar data for the orchestrator |
| `email-data-flow` | Reads and summarises email context |
| `health-data-flow` | Processes health metrics and trends |
| `amazon-music-flow` | Reads listening context and mood signals |
| `smart-home-flow` | Queries and controls smart home state |
| `weather-forecast-flow` | Retrieves and formats local weather |
| `chat-flow` | Conversational interface with full context injection |

## Tech stack

- **AI** — Google Genkit, multi-agent orchestration pattern
- **Frontend** — Next.js, TypeScript, Tailwind CSS
- **Backend** — Firebase (hosting + auth), Genkit flows
- **Widget layer** — 12 independently updating widgets: Music, Calendar, Email, Health, Smart Home, Weather, Mood, Morning Summary, Meetings, Tasks, Personalised Insights, Suggestions

## Architecture note

The core challenge was managing context across heterogeneous data sources without exploding token costs. The solution: a data-registry pattern where each flow produces a typed, normalised output. The orchestrator only receives summaries, not raw data — controlling token usage while maintaining full cross-source awareness.
