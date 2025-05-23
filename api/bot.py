import os
import hmac
import hashlib
import json
import time
import requests

API_KEY = os.environ["BITGET_API_KEY"]
API_SECRET = os.environ["BITGET_API_SECRET"]
API_PASSPHRASE = os.environ["BITGET_API_PASSPHRASE"]
SYMBOL = "BTCUSDT_SPBL"
AMOUNT_PER_ORDER = 0.001
BASE_URL = "https://api.bitget.com"

def sign(timestamp, method, path, body=""):
    content = f"{timestamp}{method}{path}{body}"
    return hmac.new(API_SECRET.encode(), content.encode(), hashlib.sha256).hexdigest()

def place_order(price, side, timestamp):
    path = "/api/spot/v1/trade/orders"
    url = BASE_URL + path
    body = json.dumps({
        "symbol": SYMBOL,
        "price": str(price),
        "size": str(AMOUNT_PER_ORDER),
        "side": side,
        "orderType": "limit"
    })
    sign_str = sign(timestamp, "POST", path, body)
    headers = {
        "ACCESS-KEY": API_KEY,
        "ACCESS-SIGN": sign_str,
        "ACCESS-TIMESTAMP": timestamp,
        "ACCESS-PASSPHRASE": API_PASSPHRASE,
        "Content-Type": "application/json"
    }
    res = requests.post(url, headers=headers, data=body)
    return res.json()

def handler(event, context):
    try:
        lower = float(event["queryStringParameters"]["lower"])
        upper = float(event["queryStringParameters"]["upper"])
        levels = int(event["queryStringParameters"]["levels"])
        if lower >= upper or levels < 2:
            return { "statusCode": 400, "body": json.dumps({"error": "Invalid grid parameters"}) }

        timestamp = str(int(time.time() * 1000))
        grid_spacing = (upper - lower) / (levels - 1)
        midpoint = (lower + upper) / 2

        results = []
        for i in range(levels):
            price = round(lower + i * grid_spacing, 2)
            side = "buy" if price < midpoint else "sell"
            results.append(place_order(price, side, timestamp))

        return { "statusCode": 200, "body": json.dumps({"message": "Orders placed", "orders": results}) }
    except Exception as e:
        return { "statusCode": 500, "body": json.dumps({"error": str(e)}) }
