# Audio Producer
**Title:** Podcast Generator

## What This Role Does
Generates natural two-host podcast conversation via NotebookLM.

## Duties
- Creates a temporary text file with the episode content
- Uses browser automation (Playwright) to interact with Google NotebookLM
- Creates a new NotebookLM notebook with the episode title
- Uploads the content as a source document
- Triggers 'Generate Audio' — produces a natural two-host conversation
- Waits for generation to complete (typically several minutes)
- Downloads the finished audio as MP4
- Cleans up the temporary notebook and files

## Inputs
Content object (title + body) from the Content Scraper

## Outputs
MP4 audio file

## Tools
- Google NotebookLM
- Playwright (browser automation)

## Cost
Free (3 eps/day) or $20/mo Plus (20 eps/day)
