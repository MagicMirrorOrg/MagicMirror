#!/usr/bin/env bash
#
# Safe update flow for a MagicMirror install.
#
# Runs pre-flight checks (disk space, stray Electron core dumps, dirty
# working tree, existing pm2 crash loop), performs a fast-forward-only
# git pull + npm install, then verifies the app still starts before
# leaving it in the new state. If pm2 detects a crash after the update,
# the repo is rolled back to the pre-update commit automatically.
#
# See: https://github.com/flightlesstux/MagicMirror/issues/1

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

MIN_FREE_MB=1024
PM2_WAIT_SECONDS=15

log()  { printf '[update.sh] %s\n' "$1"; }
fail() { printf '[update.sh] ERROR: %s\n' "$1" >&2; exit 1; }

[ -f package.json ] && [ -d .git ] || fail "run this from the MagicMirror repo root."

free_mb() {
	df -Pm "$REPO_DIR" | awk 'NR==2 {print $4}'
}

clean_core_dumps() {
	local dumps=()
	while IFS= read -r -d '' f; do dumps+=("$f"); done \
		< <(find "$REPO_DIR" -maxdepth 1 -type f \( -name 'core' -o -name 'core.*' \) -print0)

	[ "${#dumps[@]}" -eq 0 ] && return 0

	local size_kb
	size_kb=$(du -ck "${dumps[@]}" | tail -1 | awk '{print $1}')
	log "found ${#dumps[@]} stray core dump file(s) (~$((size_kb / 1024))MB) in $REPO_DIR — removing."
	rm -f -- "${dumps[@]}"
}

pm2_process_name() {
	command -v pm2 >/dev/null 2>&1 || return 1
	pm2 jlist 2>/dev/null | node -e '
		const procs = JSON.parse(require("fs").readFileSync(0, "utf8"));
		const repo = process.argv[1];
		const hit = procs.find(p => (p.pm2_env && p.pm2_env.pm_cwd) === repo);
		if (hit) process.stdout.write(hit.name);
	' "$REPO_DIR" 2>/dev/null || true
}

pm2_restart_count() {
	pm2 jlist 2>/dev/null | node -e '
		const procs = JSON.parse(require("fs").readFileSync(0, "utf8"));
		const name = process.argv[1];
		const hit = procs.find(p => p.name === name);
		process.stdout.write(String(hit ? hit.pm2_env.restart_time : 0));
	' "$1" 2>/dev/null || echo 0
}

pm2_status() {
	pm2 jlist 2>/dev/null | node -e '
		const procs = JSON.parse(require("fs").readFileSync(0, "utf8"));
		const name = process.argv[1];
		const hit = procs.find(p => p.name === name);
		process.stdout.write(hit ? hit.pm2_env.status : "unknown");
	' "$1" 2>/dev/null || echo unknown
}

# --- pre-flight ---------------------------------------------------------

log "pre-flight checks..."

clean_core_dumps

fmb=$(free_mb)
[ "$fmb" -ge "$MIN_FREE_MB" ] || fail "only ${fmb}MB free on disk, need at least ${MIN_FREE_MB}MB. Free up space before updating."
log "disk space ok (${fmb}MB free)."

if [ -n "$(git status --porcelain)" ]; then
	fail "working tree has uncommitted changes. Commit, stash, or discard them before updating (so 'git pull' can't get blocked or silently clobber local edits)."
fi
log "working tree clean."

PM2_NAME="$(pm2_process_name || true)"
if [ -n "$PM2_NAME" ]; then
	pre_status="$(pm2_status "$PM2_NAME")"
	pre_restarts="$(pm2_restart_count "$PM2_NAME")"
	log "pm2 process '$PM2_NAME' found (status=$pre_status, restarts=$pre_restarts)."
	if [ "$pre_status" != "online" ]; then
		log "warning: pm2 process is not currently 'online' — it may already be crash-looping. Updating anyway, will verify after."
	fi
else
	log "no pm2 process managing this repo detected — skipping pm2 checks."
fi

PRE_UPDATE_COMMIT="$(git rev-parse HEAD)"

# --- update --------------------------------------------------------------

log "fetching..."
git fetch --quiet

if [ "$(git rev-parse HEAD)" = "$(git rev-parse '@{u}' 2>/dev/null || echo "$PRE_UPDATE_COMMIT")" ]; then
	log "already up to date."
else
	log "pulling (fast-forward only)..."
	git pull --ff-only || fail "git pull --ff-only failed. Resolve manually (a non-fast-forward history usually means local commits diverged from the remote)."
fi

log "installing dependencies..."
npm install --omit=dev || fail "npm install failed. Repo left on new commit $(git rev-parse --short HEAD); previous commit was $(git rev-parse --short "$PRE_UPDATE_COMMIT")."

# --- post-flight verification --------------------------------------------

log "verifying..."

node --check js/electron.js || fail "js/electron.js failed a syntax check after update."
if [ -f config/config.js ]; then
	node --check config/config.js || fail "config/config.js failed a syntax check — check for syntax errors before restarting."
fi

rollback() {
	log "rolling back to $(git rev-parse --short "$PRE_UPDATE_COMMIT")..."
	git reset --hard "$PRE_UPDATE_COMMIT"
	npm install --omit=dev
	[ -n "$PM2_NAME" ] && pm2 restart "$PM2_NAME" >/dev/null 2>&1 || true
	fail "update rolled back after the app failed to come up cleanly. Investigate before retrying."
}

if [ -n "$PM2_NAME" ]; then
	log "restarting pm2 process '$PM2_NAME' and watching for a crash loop..."
	pm2 restart "$PM2_NAME" >/dev/null
	sleep "$PM2_WAIT_SECONDS"

	post_status="$(pm2_status "$PM2_NAME")"
	post_restarts="$(pm2_restart_count "$PM2_NAME")"
	dumps_after=$(find "$REPO_DIR" -maxdepth 1 -type f \( -name 'core' -o -name 'core.*' \) | wc -l | tr -d ' ')

	if [ "$post_status" != "online" ] || [ "$post_restarts" -gt "$((pre_restarts + 1))" ] || [ "$dumps_after" -gt 0 ]; then
		log "post-update check failed: status=$post_status restarts=$pre_restarts->$post_restarts new_core_dumps=$dumps_after"
		clean_core_dumps
		rollback
	fi
	log "pm2 process healthy (status=$post_status, restarts=$post_restarts)."
else
	log "no pm2 process to restart — start MagicMirror manually to verify (npm run start)."
fi

log "update complete: $(git rev-parse --short "$PRE_UPDATE_COMMIT") -> $(git rev-parse --short HEAD)"
