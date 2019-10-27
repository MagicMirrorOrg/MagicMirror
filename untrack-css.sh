# Long history here
# https://github.com/MichMich/MagicMirror/pull/1540
STATUS_CUSTOM_CSS=$(git ls-files -v css/custom.css| awk '{print $1}')

if [ "$STATUS_CUSTOM_CSS" = "H" ]; then
  echo "We'll remove from the repository the css/custom.css"
  echo "This script apply git update-index --skip-worktree css/custom.css"
  git update-index --skip-worktree css/custom.css
  git rm --cached css/custom.css
fi

