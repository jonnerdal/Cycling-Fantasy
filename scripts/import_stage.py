import requests
import pandas as pd

url = "https://www.procyclingstats.com/race/paris-nice/2026/stage-1/result"

# Add browser-like headers
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/114.0.0.0 Safari/537.36"
}

response = requests.get(url, headers=headers)

# Check status
if response.status_code != 200:
    raise Exception(f"Failed to fetch page: {response.status_code}")

# Now read HTML tables from the content
tables = pd.read_html(response.text)
stage_table = tables[0]
print(stage_table.head())