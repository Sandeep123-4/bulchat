import requests
import time
from datetime import datetime

API_URL = "http://localhost:8000/NepseIndex"


def fetch_nepse_index():
    try:
        response = requests.get(API_URL, timeout=10)
        response.raise_for_status()

        data = response.json()

        # Get NEPSE Index
        nepse = data.get("NEPSE Index")

        if nepse is None:
            print("NEPSE Index not found.")
            print("Available indexes:", list(data.keys()))
            return

        index_value = nepse.get("close")
        high = nepse.get("high")
        low = nepse.get("low")
        previous_close = nepse.get("previousClose")

        # Calculate change
        change = index_value - previous_close

        # Calculate percentage change
        change_percent = (change / previous_close) * 100

        generated_time = nepse.get("generatedTime")

        print("\n" + "=" * 50)
        print("           NEPSE LIVE INDEX")
        print("=" * 50)

        print(f"Index          : {index_value:.2f}")
        print(f"Change         : {change:+.2f}")
        print(f"Change %       : {change_percent:+.2f}%")
        print(f"High           : {high:.2f}")
        print(f"Low            : {low:.2f}")
        print(f"Previous Close : {previous_close:.2f}")
        print(f"API Time       : {generated_time}")
        print(f"Fetched        : {datetime.now().strftime('%H:%M:%S')}")

        print("=" * 50)

    except requests.exceptions.RequestException as e:
        print("API connection error:", e)

    except Exception as e:
        print("Error:", e)


print("NEPSE Index Fetcher Started")
print("Press CTRL+C to stop.")

while True:
    fetch_nepse_index()

    # Wait 30 seconds
    time.sleep(30)