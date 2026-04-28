#!/bin/bash
# gbp-pull/bin/pull.sh
#
# DETERMINISTIC: fetch GBP data via Places API for a known Place ID
# Same input → same output (modulo time-varying review content + Google's response)
#
# Usage: pull.sh CLIENT_KEY TYPE [PROJECT_ROOT] [REFRESH_SITE_PATH]
#   TYPE = reviews | details | audit
#   PROJECT_ROOT = where to save output JSON (default $PWD/audit/gbp/)
#   REFRESH_SITE_PATH = optional. If set, ALSO copy the API response to this path
#                       (e.g., site-astro/src/data/reviews.json). The caller (skill)
#                       passes this when components depend on the JSON as live data.
#
# Output: stdout = absolute path to written audit-log JSON file
# Reads: state/place-ids.json (must exist; populated by find-place.sh)
#
# Auth: $GBP_ACCOUNT, $GBP_PROJECT (defaults to bill@reiamplifi.com + rei-amplifi-tools)

set -e

CLIENT_KEY="$1"
TYPE="$2"
PROJECT_ROOT="${3:-$PWD}"
REFRESH_SITE_PATH="$4"

if [ -z "$CLIENT_KEY" ] || [ -z "$TYPE" ]; then
  echo "Usage: $0 CLIENT_KEY TYPE [PROJECT_ROOT] [REFRESH_SITE_PATH]" >&2
  echo "  TYPE = reviews | details | audit" >&2
  exit 1
fi

GBP_ACCOUNT="${GBP_ACCOUNT:-bill@reiamplifi.com}"
GBP_PROJECT="${GBP_PROJECT:-rei-amplifi-tools}"
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STATE_FILE="${SKILL_DIR}/state/place-ids.json"

if [ ! -f "$STATE_FILE" ]; then
  echo "ERROR: state/place-ids.json missing. Run find-place.sh first." >&2
  exit 2
fi

PLACE_ID=$(python3 -c "
import json, sys
d = json.load(open('$STATE_FILE'))
e = d.get('$CLIENT_KEY')
if not e:
    print('MISSING_CLIENT', file=sys.stderr); sys.exit(1)
print(e['placeId'])
" 2>&1) || {
  echo "ERROR: client '$CLIENT_KEY' not in state/place-ids.json. Run find-place.sh CLIENT_KEY 'name, address'" >&2
  exit 3
}

case "$TYPE" in
  reviews)
    FIELD_MASK="id,displayName,rating,userRatingCount,reviews"
    ;;
  details)
    FIELD_MASK="id,displayName,formattedAddress,internationalPhoneNumber,websiteUri,rating,userRatingCount,regularOpeningHours,priceLevel,types,googleMapsUri,businessStatus"
    ;;
  audit)
    FIELD_MASK="id,displayName,formattedAddress,internationalPhoneNumber,websiteUri,rating,userRatingCount,regularOpeningHours,reviews,photos,googleMapsUri,businessStatus,types"
    ;;
  *)
    echo "ERROR: unknown TYPE '$TYPE'. Expected: reviews | details | audit" >&2
    exit 4
    ;;
esac

TOKEN=$(gcloud auth print-access-token --account="$GBP_ACCOUNT" 2>/dev/null)

DATESTAMP=$(date -u +%Y-%m-%d)
OUTPUT_DIR="${PROJECT_ROOT}/audit/gbp"
OUTPUT_FILE="${OUTPUT_DIR}/${CLIENT_KEY}-${TYPE}-${DATESTAMP}.json"
mkdir -p "$OUTPUT_DIR"

curl -sf \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Goog-User-Project: ${GBP_PROJECT}" \
  -H "X-Goog-FieldMask: ${FIELD_MASK}" \
  "https://places.googleapis.com/v1/places/${PLACE_ID}" \
  -o "$OUTPUT_FILE" || {
  echo "ERROR: API call failed for placeId=$PLACE_ID type=$TYPE" >&2
  exit 5
}

# If REFRESH_SITE_PATH is set, copy the response there too (live data the site reads)
if [ -n "$REFRESH_SITE_PATH" ]; then
  mkdir -p "$(dirname "$REFRESH_SITE_PATH")"
  cp "$OUTPUT_FILE" "$REFRESH_SITE_PATH"
  echo "✓ Site refresh: $REFRESH_SITE_PATH" >&2
fi

# Append to last-pull log
LAST_PULL_LOG="${SKILL_DIR}/state/last-pull.json"
python3 -c "
import json, os, sys
log_file = '$LAST_PULL_LOG'
log = []
if os.path.exists(log_file):
    with open(log_file) as f:
        log = json.load(f)
log.append({
    'client': '$CLIENT_KEY',
    'type': '$TYPE',
    'placeId': '$PLACE_ID',
    'outputFile': '$OUTPUT_FILE',
    'refreshSitePath': '$REFRESH_SITE_PATH' or None,
    'timestamp': '$(date -u +%Y-%m-%dT%H:%M:%SZ)',
})
log = log[-100:]  # keep last 100 entries
with open(log_file, 'w') as f:
    json.dump(log, f, indent=2)
"

echo "$OUTPUT_FILE"
