#!/bin/bash
# gbp-pull/bin/find-place.sh
#
# DETERMINISTIC: locate Google Place ID by client name + address
# Same input → same output (Place IDs are stable resource identifiers)
#
# Usage: find-place.sh CLIENT_KEY "BUSINESS_NAME, ADDRESS"
# Output: stdout = JSON {placeId, name, address, rating, reviewCount, mapsUri}
# Caches to: state/place-ids.json (keyed by CLIENT_KEY)
#
# Auth: gcloud access token from --account=$GBP_ACCOUNT (default bill@reiamplifi.com)
# Quota project: $GBP_PROJECT (default rei-amplifi-tools — agency project, billing-linked, Places API enabled)

set -e

CLIENT_KEY="$1"
QUERY="$2"

if [ -z "$CLIENT_KEY" ] || [ -z "$QUERY" ]; then
  echo "Usage: $0 CLIENT_KEY 'BUSINESS_NAME, ADDRESS'" >&2
  exit 1
fi

GBP_ACCOUNT="${GBP_ACCOUNT:-bill@reiamplifi.com}"
GBP_PROJECT="${GBP_PROJECT:-rei-amplifi-tools}"
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STATE_FILE="${SKILL_DIR}/state/place-ids.json"

TOKEN=$(gcloud auth print-access-token --account="$GBP_ACCOUNT" 2>/dev/null) || {
  echo "ERROR: failed to get token for $GBP_ACCOUNT. Run: gcloud auth login $GBP_ACCOUNT" >&2
  exit 2
}

RESPONSE=$(curl -sf -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Goog-User-Project: ${GBP_PROJECT}" \
  -H "Content-Type: application/json" \
  -H "X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri" \
  "https://places.googleapis.com/v1/places:searchText" \
  -d "{\"textQuery\":\"${QUERY//\"/\\\"}\"}")

if [ -z "$RESPONSE" ] || ! echo "$RESPONSE" | python3 -c 'import sys, json; d = json.load(sys.stdin); sys.exit(0 if d.get("places") else 1)' 2>/dev/null; then
  echo "ERROR: no Place returned for query: $QUERY" >&2
  echo "$RESPONSE" >&2
  exit 3
fi

# Extract first hit (most relevant) and emit canonical JSON
PLACE=$(echo "$RESPONSE" | python3 -c '
import sys, json
d = json.load(sys.stdin)
p = d["places"][0]
out = {
  "placeId": p["id"],
  "name": p.get("displayName", {}).get("text", ""),
  "address": p.get("formattedAddress", ""),
  "rating": p.get("rating"),
  "reviewCount": p.get("userRatingCount"),
  "mapsUri": p.get("googleMapsUri", ""),
}
print(json.dumps(out, indent=2))
')

# Cache to state/place-ids.json (idempotent — overwrites prior entry for same CLIENT_KEY)
mkdir -p "$(dirname "$STATE_FILE")"
python3 -c "
import json, os, sys
state_file = '$STATE_FILE'
client_key = '$CLIENT_KEY'
new_entry = json.loads('''$PLACE''')
state = {}
if os.path.exists(state_file):
    with open(state_file) as f:
        state = json.load(f)
state[client_key] = new_entry
state[client_key]['_lastUpdated'] = '$(date -u +%Y-%m-%dT%H:%M:%SZ)'
with open(state_file, 'w') as f:
    json.dump(state, f, indent=2)
"

echo "$PLACE"
