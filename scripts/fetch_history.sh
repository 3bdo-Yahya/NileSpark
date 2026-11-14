#!/usr/bin/env bash
# Fetch FIRMS country-year CSVs into data/raw/{sensor}/{year}/.
# Usage: scripts/fetch_history.sh <Country> <sensor> <first_year> <last_year>
#   e.g. scripts/fetch_history.sh Egypt modis 2000 2024
set -euo pipefail

country="$1"
sensor="$2"
first="$3"
last="$4"
base="https://firms.modaps.eosdis.nasa.gov/data/country"
root="$(cd "$(dirname "$0")/.." && pwd)/data/raw"

for year in $(seq "$first" "$last"); do
  dir="$root/$sensor/$year"
  file="$dir/${sensor}_${year}_${country}.csv"
  mkdir -p "$dir"
  if [[ -s "$file" ]]; then
    echo "skip $file"
    continue
  fi
  if curl -sf --retry 3 -m 900 -o "$file.tmp" "$base/$sensor/$year/${sensor}_${year}_${country}.csv"; then
    mv "$file.tmp" "$file"
    echo "ok $file $(stat -c%s "$file")"
  else
    rm -f "$file.tmp"
    echo "FAIL $file"
  fi
done
