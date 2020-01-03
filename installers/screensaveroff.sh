#/bin/bash
logfile=~/screensaver.log
mac=$(uname -s)

	if [ $mac == 'Darwin' ]; then
	  setting=$(defaults -currentHost read com.apple.screensaver idleTime)
		if [ $setting != 0 ] ; then
			echo disable screensaver via mac profile >> $logfile
			defaults -currentHost write com.apple.screensaver idleTime 0
		else
			echo mac profile screen saver already disabled >> $logfile
		fi
	else
	  # find out if some screen saver running

		# get just the running processes and args
		# just want the program name
		# find the 1st with 'saver' in it (should only be one)
		# if the process name is a path, parse it and get the last field ( the actual pgm name)

	  screen_saver_running=$(ps -A -o args | awk '{print $1}' | grep -m1 [s]aver | awk -F\/ '{print $NF}');

		# if we found something
		if [ "$screen_saver_running." != "." ]; then
		  # some screensaver running
			case "$screen_saver_running" in
			 mate-screensaver) echo 'mate screen saver' >>$logfile
			   #killall mate-screensaver >/dev/null 2>&1
			   #ms=$(which mate-screensaver-command)
			   #$ms -d >/dev/null 2>&1
						gsettings set org.mate.screensaver lock-enabled false	 2>/dev/null
						gsettings set org.mate.screensaver idle-activation-enabled false	 2>/dev/null
						gsettings set org.mate.screensaver lock_delay 0	 2>/dev/null
				 echo " $screen_saver_running disabled" >> $logfile
				 DISPLAY=:0  mate-screensaver  >/dev/null 2>&1 &
			   ;;
			 gnome-screensaver) echo 'gnome screen saver' >>$logfile
			   gnome_screensaver-command -d >/dev/null 2>&1
				 echo " $screen_saver_running disabled" >> $logfile
			   ;;
			 xscreensaver) echo 'xscreensaver running' | tee -a $logfile
				 if [ $(grep -m1 'mode:' ~/.xscreensaver | awk '{print $2}') != 'off' ]; then
					 sed -i 's/$xsetting/mode: off/' ~/.xscreensaver
					 echo " xscreensaver set to off" >> $logfile
				 else
				   echo " xscreensaver already disabled" >> $logfile
				 fi
			   ;;
			 gsd-screensaver | gsd-screensaver-proxy)
					setting=$(gsettings get org.gnome.desktop.screensaver lock-enabled)
					setting1=$(gsettings get org.gnome.desktop.session idle-delay)
					if [ "$setting $setting1" != 'false uint32 0' ]; then
						echo disable screensaver via gsettings was $setting and $setting1>> $logfile
						gsettings set org.gnome.desktop.screensaver lock-enabled false
						gsettings set org.gnome.desktop.screensaver idle-activation-enabled false
						gsettings set org.gnome.desktop.session idle-delay 0
					else
						echo gsettings screen saver already disabled >> $logfile
					fi
					;;
			 *) echo "some other screensaver $screen_saver_running" found | tee -a $logfile
			    echo "please configure it manually" | tee -a $logfile
			   ;;
		  esac
		elif [ -e "/etc/lightdm/lightdm.conf" ]; then
		  # if screen saver NOT already disabled?
			if [ $(grep 'xserver-command=X -s 0 -dpms' /etc/lightdm/lightdm.conf | wc -l) == 0 ]; then
			  echo install screensaver via lightdm.conf >> $logfile
				sudo sed -i '/^\[Seat:\*\]/a xserver-command=X -s 0 -dpms' /etc/lightdm/lightdm.conf
				#sudo cp _myconf /etc/lightdm/lightdm.conf
				#rm _myconf >/dev/null
			else
			  echo screensaver via lightdm already disabled >> $logfile
			fi
		elif [ $(which gsettings | wc -l) == 1 ]; then
			setting=$(gsettings get org.gnome.desktop.screensaver lock-enabled)
			setting1=$(gsettings get org.gnome.desktop.session idle-delay)
			if [ "$setting $setting1" != 'false uint32 0' ]; then
			  echo disable screensaver via gsettings was $setting and $setting1>> $logfile
				gsettings set org.gnome.desktop.screensaver lock-enabled false
				gsettings set org.gnome.desktop.screensaver idle-activation-enabled false
				gsettings set org.gnome.desktop.session idle-delay 0
			else
			  echo gsettings screen saver already disabled >> $logfile
			fi
		elif [ -d "/etc/xdg/lxsession" ]; then
		  currently_set=$(grep -m1 '\-dpms' /etc/xdg/lxsession/LXDE-pi/autostart)
			if [ "$currently_set." == "." ]; then
				echo disable screensaver via lxsession >> $logfile
				# turn it off for the future
				sudo su -c "echo -e '@xset s noblank\n@xset s off\n@xset -dpms' >> /etc/xdg/lxsession/LXDE-pi/autostart"
				# turn it off now
				export DISPLAY=:0; xset s noblank;xset s off;xset -dpms
			else
			  echo lxsession screen saver already disabled >> $logfile
			fi
		else
			echo " "
			echo -e "unable to disable screen saver, /etc/xdg/lxsession does not exist" | tee >>$logfile
		fi
	fi
