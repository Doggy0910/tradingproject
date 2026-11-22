import os
import time
from typing import Any
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
from pydantic import BaseModel

APP_NAME = "MEMESCAN AI Market API"
DEXSCREENER_URL = "https://api.dexscreener.com/latest/dex/tokens"
BOOSTED_URL = "https://api.dexscreener.com/token-boosts/top/v1"
GECKO_OHLCV_URL = "https://api.geckoterminal.com/api/v2/networks/solana/pools"
CACHE_TTL_SECONDS = 30
cache: dict[str, tuple[float, Any]] = {}

app = FastAPI(title=APP_NAME, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


class Token(BaseModel):
    address: str
    pairAddress: str
    name: str
    symbol: str
    dexId: str
    url: str
    imageUrl: str | None
    pairCreatedAt: int | None
    priceUsd: float | None
    marketCap: float | None
    liquidityUsd: float | None
    volume24h: float | None
    volumeChange24h: float | None
    priceChange24h: float | None
    txns24h: int | None


def number(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def integer(value: Any) -> int | None:
    value = number(value)
    return int(value) if value is not None else None


def cache_get(key: str) -> Any | None:
    entry = cache.get(key)
    if entry and time.monotonic() - entry[0] < CACHE_TTL_SECONDS:
        return entry[1]
    if entry:
        cache.pop(key, None)
    return None


async def provider_get(url: str, client: httpx.AsyncClient) -> Any:
    try:
        response = await client.get(url, timeout=12)
        response.raise_for_status()
        return response.json()
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="The market data provider timed out") from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"The market data provider returned HTTP {exc.response.status_code}") from exc
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail="Unable to reach the market data provider") from exc


@app.exception_handler(HTTPException)
async def http_error_handler(_: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": APP_NAME}


@app.get("/api/market/pairs/{pair_address}/ohlcv")
async def pair_ohlcv(
    pair_address: str,
    timeframe: str = Query(default="hour", pattern="^(minute|hour|day)$"),
    aggregate: int = Query(default=15, ge=1, le=360),
    limit: int = Query(default=250, ge=20, le=1000),
):
    timeframe = timeframe.lower()
    cache_key = f"ohlcv:{pair_address}:{timeframe}:{aggregate}:{limit}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    url = f"{GECKO_OHLCV_URL}/{pair_address}/ohlcv/{timeframe}?aggregate={aggregate}&limit={limit}"
    async with httpx.AsyncClient() as client:
        payload = await provider_get(
            url,
            client,
        )

    rows = (
        payload.get("data", {}).get("attributes", {}).get("ohlcv_list", [])
        if isinstance(payload, dict)
        else []
    )
    candles = []
    for row in rows:
        if not isinstance(row, list) or len(row) < 5:
            continue
        try:
            timestamp, open_price, high, low, close = row[:5]
            volume = row[5] if len(row) > 5 else None
            candles.append({
                "time": int(timestamp),
                "open": float(open_price),
                "high": float(high),
                "low": float(low),
                "close": float(close),
                "volume": float(volume) if volume is not None else None,
            })
        except (TypeError, ValueError):
            continue

    result = {
        "pairAddress": pair_address,
        "timeframe": timeframe,
        "aggregate": aggregate,
        "source": "geckoterminal",
        "candles": sorted(candles, key=lambda candle: candle["time"]),
    }
    cache[cache_key] = (time.monotonic(), result)
    return result


@app.get("/api/market/tokens")
async def market_tokens(limit: int = Query(default=100, ge=1, le=200)):
    cache_key = f"tokens:{limit}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    async with httpx.AsyncClient() as client:
        boosted = await provider_get(BOOSTED_URL, client)

    addresses: list[str] = []
    if isinstance(boosted, list):
        for item in boosted:
            if not isinstance(item, dict):
                continue
            if item.get("chainId") != "solana":
                continue
            address = item.get("tokenAddress")
            if isinstance(address, str) and address not in addresses:
                addresses.append(address)

    if not addresses:
        raise HTTPException(status_code=502, detail="The provider returned no Solana boosted tokens")

    batch = addresses[:limit]
    url = DEXSCREENER_URL + "/" + ",".join(batch)
    async with httpx.AsyncClient() as client:
        payload = await provider_get(url, client)

    pairs = payload.get("pairs", []) if isinstance(payload, dict) else []
    tokens: list[Token] = []
    for pair in pairs:
        if not isinstance(pair, dict) or pair.get("chainId") != "solana":
            continue
        base = pair.get("baseToken") or {}
        address = base.get("address")
        if not isinstance(address, str):
            continue
        volume = pair.get("volume") or {}
        price_change = pair.get("priceChange") or {}
        txns = pair.get("txns") or {}
        liquidity = pair.get("liquidity") or {}
        tx_24h = txns.get("h24") or {}
        transactions = (integer(tx_24h.get("buys")) or 0) + (integer(tx_24h.get("sells")) or 0)
        tokens.append(Token(
            address=address,
            pairAddress=str(pair.get("pairAddress") or ""),
            name=str(base.get("name") or "Unknown token"),
            symbol=str(base.get("symbol") or "UNKNOWN"),
            dexId=str(pair.get("dexId") or "Unknown"),
            url=str(pair.get("url") or f"https://dexscreener.com/solana/{pair.get('pairAddress') or ''}"),
            imageUrl=(pair.get("info") or {}).get("imageUrl") if isinstance(pair.get("info"), dict) else None,
            pairCreatedAt=integer(pair.get("pairCreatedAt")),
            priceUsd=number(pair.get("priceUsd")),
            marketCap=number(pair.get("marketCap")),
            liquidityUsd=number(liquidity.get("usd")),
            volume24h=number(volume.get("h24")),
            volumeChange24h=number((pair.get("volumeChange") or {}).get("h24")),
            priceChange24h=number(price_change.get("h24")),
            txns24h=transactions,
        ))

    result = {"tokens": [token.model_dump() for token in tokens], "source": "dexscreener", "updatedAt": int(time.time())}
    cache[cache_key] = (time.monotonic(), result)
    return result
