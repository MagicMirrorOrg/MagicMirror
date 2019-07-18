if [ -z "$DISPLAY" ]; then #If not set DISPLAY is SSH remote or tty
	export DISPLAY=:0 # Set by default display
fi
if [ ! -f css/custom.css ]; then
  cp css/custom-example.css css/custom.css
fi
electron js/electron.js $1
