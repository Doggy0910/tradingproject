# MEMESCAN AI

MEMESCAN AI is a Solana market-monitoring and paper-trading workspace. It combines a React/TypeScript frontend with a small FastAPI service that fetches public pair data and candle history.

## Requirements

- Node.js 22.12 or newer
- Python 3.10 or newer

## Run locally on Windows

1. Install frontend dependencies:

   ```powershell
   npm ci
   ```

2. Create and activate a Python environment, then install backend dependencies:

   ```powershell
   py -3 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   ```

3. Start the API in one terminal:

   ```powershell
   python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
   ```

4. Start the frontend in another terminal:

   ```powershell
   npm run dev
   ```

   Open the URL printed by Vite (normally `http://localhost:5173`). Vite proxies `/api` requests to the local FastAPI service.

The API health check is available at `http://127.0.0.1:8000/api/health`.

## Checks

```powershell
npm run lint
npm run build
python -m py_compile backend\main.py
```

## Data and functionality

- The market feed uses DexScreener's public Solana boosted-token and pair endpoints.
- Historical candles are fetched from GeckoTerminal for the selected pair.
- The scanner, local watchlists, training studies, and simulated portfolio operate on the returned pair data.
- Paper trades and preferences are stored in the browser's local storage. No real orders are sent.
- AI-assisted studies use transparent local rules over the available pair metrics; no LLM provider is configured.
- The risk page does not claim contract safety or holder analysis because those verified data are not supplied by the current feed.
- Price levels and scores are educational scenarios, not predictions or guarantees of profit or execution.

No API credentials are required for the public market-data providers. Do not put provider secrets in frontend environment variables. For production, deploy the frontend and API behind a configured reverse proxy; the `/api` proxy in `vite.config.ts` is for local development.
