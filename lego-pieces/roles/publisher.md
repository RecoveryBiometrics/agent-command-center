# Publisher
**Title:** Distribution

## What This Role Does
Uploads episodes to Transistor.fm for distribution to all podcast platforms.

## Duties
- Requests an authorized upload URL from Transistor.fm API
- Uploads the audio file directly to Transistor's storage
- Creates the episode record with: SEO title, description, tags, transcript, audio URL
- Sets episode status to 'published' (immediately live)
- Transistor auto-distributes to: Spotify, Apple Podcasts, Amazon Music, Google Podcasts
- Returns the episode's share URL and embeddable HTML player
- Logs the episode to prevent re-processing

## Inputs
Audio file, SEO metadata (title, description, tags), transcript text

## Outputs
Published episode with: Transistor ID, share URL, embed HTML

## Tools
- Transistor.fm API

## Cost
$19/mo (Transistor hosting)
