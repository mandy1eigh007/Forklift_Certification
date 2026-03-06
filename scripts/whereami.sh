#!/usr/bin/env bash
set -euo pipefail
echo "== git =="
git status -sb
echo
echo "== last 10 commits =="
git --no-pager log -10 --oneline
echo
echo "== WORKLOG last entry =="
tail -n 60 docs/WORKLOG.md || true
echo
echo "== STATE =="
cat docs/STATE.json || true
