# Transcriber
**Title:** Audio-to-Text

## What This Role Does
Converts podcast audio to text with speaker labels.

## Duties
- Uploads the MP4 audio file to Gemini API
- Sends a transcription prompt requesting full accuracy with speaker labels
- Returns complete transcript text with Host 1 / Host 2 labels
- Enables full-text search within podcast apps
- Improves accessibility for hearing-impaired listeners
- Optional — pipeline continues without transcription if this fails or is disabled

## Inputs
MP4 audio file from the Audio Producer

## Outputs
Full transcript text with speaker labels

## Tools
- Google Gemini 2.0 Flash

## Cost
~$0.05/day
