$branch = git branch --show-current
if (-not $branch) { exit 0 }

git add -A

$changes = git diff --cached --name-only
if (-not $changes) { exit 0 }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Claude auto update - $timestamp"
git push origin $branch