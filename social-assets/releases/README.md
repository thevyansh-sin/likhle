# Release Assets

This folder is the default output location for the Likhle release-post exporter.

## Export Script
- Script: `scripts/export-release-post.ps1`

## Output Types
- `1080 x 1350` PNG
- `1080 x 1350` JPG

## Example

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\export-release-post.ps1 `
  -Version "v0.2.26" `
  -Headline "Owner mode is live" `
  -Bullets "Skip app-side cooldowns|Unlock one owner browser|Faster QA loops" `
  -Cta "Try owner mode"
```

## Notes
- Generated image files in this folder are ignored by git.
- Keep the style dark, matte, and controlled-lime to match the Likhle brand.
