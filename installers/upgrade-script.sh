#!/bin/bash
# only DO npm installs when flag is set to  1
# test when set to 0
true=1
false=0
doinstalls=$false
force=$false
justActive=$true
test_run=$true
stashed=$false 
keyFile=package.json
forced_arch=
git_active_lock='./.git/index.lock'
lf=$'\n'
git_user_name=
git_user_email=

trim() {
    local var="$*"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"   
    echo -n "$var"
}
# is this a mac
mac=$(uname -s)
# get the processor architecture
arch=$(uname -m)
if [ $mac == 'Darwin' ]; then
	cmd=greadlink
else
	cmd=readlink
fi
if [ -d ~/MagicMirror ]; then

	# put the log where the script is located
	logdir=$(dirname $($cmd -f "$0"))
	# if the script was execute from the web
	if [[ $logdir != *"MagicMirror/installers"* ]]; then
		# use the MagicMirror/installers folder
		cd ~/MagicMirror/installers >/dev/null
		logdir=$(pwd)
		cd - >/dev/null
	fi
	logfile=$logdir/upgrade.log
  echo the log will be $logfile
	echo  >>$logfile
	date +"Upgrade started - %a %b %e %H:%M:%S %Z %Y" >>$logfile
	echo system is $(uname -a) >> $logfile
	echo the os is $(lsb_release -a) >> $logfile

	# because of how its executed from the web, p0 gets overlayed with parm
	# check to see if a parm was passed .. easy apply without  editing
	p0=$0
	# if not 'bash', and some parm specified
	if [ $0 != 'bash' -a "$1." != "." ]; then
		# then executed locally
		# get the parm
		p0=$1
	fi
	# lowercase it.. watch out, mac stuff doesn't work  with tr, etc
	p0=$(echo $p0  | cut -c 1-5 |  awk '{print tolower($0)}' )
	if [ $p0 == 'apply' ]; then
		echo user requested to apply changes >>$logfile
		doinstalls=$true
		test_run=$false
	elif [ $p0 == 'force' ]; then
		echo user requested to force apply changes >>$logfile
		doinstalls=$true
		force=$true
		test_run=$false	
	fi

	if [ $test_run == $true ]; then 
		echo doing test run = true | tee -a $logfile
	else
		echo doing test run = false | tee -a $logfile
	fi

	# if we want just the modules listed in config.js now
	if [ $justActive == $true ]; then 
		 if [ ! -f ~/MagicMirror/installers/dumpactivemodules.js ]; then
				echo downloading dumpactivemodules script >> $logfile
				curl -sL https://www.dropbox.com/s/wwe6bfg2lcjmj43/dumpactivemodules.js?dl=0 > ~/MagicMirror/installers/dumpactivemodules.js
		 fi
	fi
	echo update log will be in $logfile
	# used for parsing the array of module names
	SAVEIFS=$IFS   # Save current IFS
	IFS=$'\n'   

	echo | tee -a $logfile			
	# if the git lock file exists and git is not running
	if [ -f git_active_lock ]; then 
		 # check to see if git is actually running
		 git_running=`ps -ef | grep git | grep -v color | grep -v 'grep git' | wc -l`
		 # if not running
		 if [ git_running == $false ]; then 
				# clean up the dangling lock file
				echo erasing abandonded git lock file >> $logfile
				rm git_active_lock >/dev/null 2>&1
		 else
				# git IS running, we can't proceed
				echo it appears another instance of git is running | tee -a $logfile
				# if this is an actual run 
				if [ $doinstalls == $true ]; then 
					# force it back to test run
					doinstalls = $false
					test_run=$true
					echo forcing test run mode | tee -a $logfile
					echo please resolve git running already and start the update again | tee -a $logfile
				fi 
		 fi
	fi 
	
	# change to MagicMirror folder
	cd ~/MagicMirror

		# save custom.css
		cd css 
			echo "saving custom.css" | tee -a $logfile
			cp -p custom.css save_custom.css
		cd - >/dev/null
		save_alias=$(alias git 2>/dev/null)
		lang=$(locale | grep LANGUAGE | awk -F= '{print $2}')
		# make sure git respones are in english, so code works
		if [ "$lang." != "en_US.UTF-8." ]; then
       echo not english or locale not set, set git alias >>$logfile	
			 if [ "$LC_ALL." == "." ]; then
					alias git='LANGUAGE=en_US.UTF-8 git' >>$logfile
			 else
					alias git='LC_ALL=en_US.UTF-8 git' >>$logfile
			 fi
			 #alias >>$logfile
		fi
		# get the git remote name 
		remote=$(git remote 2>/dev/null | awk '{print $1}')	

		# if remote name set
		if [ "$remote." != "." ]; then 
		
			echo remote name = $remote >>$logfile
			
		  # get the local and remote package.json versions
			local_version=$(grep -m1 version package.json | awk -F\" '{print $4}')
			remote_version=$(curl -s https://raw.githubusercontent.com/MichMich/MagicMirror/master/package.json | grep -m1 version | awk -F\" '{print $4}')
			
			# only change if they are different
			if [ "$local_version." != "$remote_version." -o $force == $true -o $test_run == $true ]; then 
				echo upgrading from version $local_version to $remote_version | tee -a $logfile		
		
				# get the latest upgrade		
				echo fetching latest revisions | tee -a $logfile
				git fetch $remote >/dev/null 
				rc=$?
				echo git fetch rc=$rc >>$logfile
				if [ $rc -eq 0 ]; then
				
					# need to get the current branch
					current_branch=$(git branch | grep "*" | awk '{print $2}')
					echo current branch = $current_branch >>$logfile
					
					git status 2>&1 >>$logfile
					
					# get the names of the files that are different locally
					diffs=$(git status 2>&1 | grep modified | awk -F: '{print $2}')
					
					# split names into an array
					diffs=($diffs) # split to array $diffs
					
					# if there are different files (array size greater than zero)
					if [ ${#diffs[@]} -gt 0 ]; then   
					  package_lock=0
						echo there are "${#diffs[@]}" local files that are different than the master repo | tee -a $logfile
						echo | tee -a $logfile
						for file in "${diffs[@]}"
						do 
							echo "$file" | tee -a $logfile 
							if [ $(echo $file | grep  '\-lock.json$' | wc -l) -eq 1 ]; then
								package_lock=$true
							fi
						done
						echo | tee -a $logfile
						if [ $package_lock -eq 1 ]; then 
							echo "any *-lock.json files do not need to be saved"
						fi
						read -p "do you want to save these files for later   (Y/n)?" choice 
						echo save/restore files selection = $choice >> $logfile 					
						if [[ $choice =~ ^[Yy]$ ]]; then 
						  git_user=$(git config --global --get user.email)
							if [ "git_user." == "." ]; then 
							   git_user_name="-c user.name=upgrade_script"
								 git_user_email="-c user.email=script@upgrade.com"
							fi 
							git git_user_name git_user_email stash >>$logfile
							stashed=$true
						else		
							for file in "${diffs[@]}"
							do
								f="$(trim "$file")"
								echo restoring $f from repo >> $logfile
								if [ $test_run == $false ]; then 
									git checkout HEAD -- $f | tee -a $logfile
								else
								  echo skipping restore for $f, doing test run | tee -a $logfile
								fi 
							done
						fi 
					else
						echo no files different from github version >> $logfile
					fi 

					# lets test merge, in memory, no changes to working directory or local repo
					test_merge_output=$(git merge-tree `git merge-base $current_branch HEAD` HEAD $current_branch | grep "^<<<<<<<\|changed in both")
					echo "test merge result rc='$test_merge_output' , if empty, no conflicts" >> $logfile
					
					# if there were no conflicts reported
					if [ "$test_merge_output." == "." ]; then 
					
						if [ $test_run == $false ]; then 
							# go ahead and merge now						
							echo "executing merge, apply specified" >> $logfile
							# get the text output of merge
							merge_output=$(git merge $remote/$current_branch 2>&1) 
							# and its return code		
							merge_result=$?		
							# make any long line readable
							merge_output=$(echo $merge_output | tr '|' '\n'| sed "s/create/\\${lf}create/g" | sed "s/mode\ change/\\${lf}mode\ change/g")
							echo -e "merge result rc= $merge_result\n $merge_output">> $logfile							
						else 
						  echo "skipping merge, only test run" >> $logfile
							merge_output=''
							merge_result=0
						fi 

						# if no merge errors
						if [ $merge_result == 0 ]; then 
							# some updates applied
							if [ "$merge_output." != 'Already up to date.' -o $test_run == $true ]; then
								# update any dependencies for base
								if [ $doinstalls == $true ]; then 
								  # if this is a pi zero 
									echo processor architecture is $arch >> $logfile
									if [ "$arch" == "armv6l" ]; then 
									   # force to look like pi 2
										 echo forcing architecture armv7l >>$logfile
										 forced_arch='--arch=armv7l'
									fi 
									echo "updating MagicMirror runtime, please wait" | tee -a $logfile
									npm install $forced_arch 2>&1 | tee -a $logfile
									done_update=`date +"completed - %a %b %e %H:%M:%S %Z %Y"`
									echo npm install $done_update on base >> $ logfile
								fi
								# process updates for modules after base changed
								cd modules			
									if [ $justActive == $true ]; then
										# get the list of ACTIVE modules with  package.json files
										mtype=active
										modules=$(node ../installers/dumpactivemodules.js) 
									else
										# get the list of INSTALLED modules with  package.json files
										mtype=installed
										modules=$(find  -maxdepth 2 -name 'package.json' -printf "%h\n" | cut -d'/' -f2 ) 
									fi 
									modules=($modules) # split to array $modules
									
									# if the array has entries in it
									if [ ${#modules[@]} -gt  0 ]; then 
									  echo >> $logfile
										echo "processing dependency changes for $mtype modules with package.json files" | tee -a $logfile
										echo
										for module in "${modules[@]}" 
										do
											echo "processing for module" $module please wait | tee -a $logfile
											echo '----------------------------------' | tee -a $logfile					
											# change to that directory
											cd  $module
												# process its dependencies
												if [ $doinstalls == $true ]; then
													 npm install $forced_arch 2>&1| tee -a $logfile
												else
													echo skipped processing for $module, doing test run | tee -a $logfile													
												fi
											# return to modules folder
											cd .. >/dev/null
											echo "processing complete for module" $module | tee -a $logfile
											echo
										done
									else 
										echo "no modules found needing npm refresh" | tee -a $logfile
									fi 
								# return to Magic Mirror folder
								cd .. >/dev/null
							else
								echo "no changes detected for modules, skipping " | tee -a $logfile				
							fi
						else
							echo there were merge errors | tee -a $logfile
							echo $merge_output | tee -a %logfile
							echo you should examine and resolve them 	 | tee -a $logfile	
							echo using the command git log --oneline --decorate | tee -a $logfile
							git log --oneline --decorate | tee -a $logfile
						fi 
					else 
						echo "there are merge conflicts to be resolved, no changes have been applied" | tee -a $logfile
						echo $test_merge_output | tee -a $logfile
					fi
				else
					echo "MagicMirror git fetch failed" | tee -a $logfile
				fi
			else
			  echo "local version $local_version already same as master $remote_version" | tee -a $logfile
			fi 
		else
		  echo "Unable to determine upstream git repository" | tee -a $logfile
		fi
		# should be in MagicMirror base
		cd css
			# restore  custom.css
			echo "restoring custom.css" | tee -a $logfile
			cp -p save_custom.css custom.css
			rm save_custom.css
		cd - >/dev/null
		if [ "$lang." != "en_US.UTF-8." ]; then 		
		   if [ "$save_alias." != "." ]; then 
			    echo restoring git alias >>$logfile
			    $save_alias >/dev/null
			 else
			    echo removing git alias >>$logfile
			    unalias git >/dev/null
			 fi 
		fi
	IFS=$SAVEIFS   # Restore IFS

	if [ $stashed == $true ]; then 
		 if [ $test_run == $true ]; then 
			 echo test run, restoring files stashed | tee -a $logfile
			 git git_user_name git_user_email stash pop  >> $logfile
		 else	 
			 echo we stashed a set of files that appear changed from the latest repo versions. you should review them | tee -a $logfile
			 git stash show --name-only > installers/stashed_files
			 echo see installers/stashed_files for the list 
			 echo 
			 echo you can use git checkout "stash@{0}" -- filename to extract one file from the stash 
			 echo 
			 echo or git stash pop to restore them all 
			 echo
			 echo WARNING..	 	 
			 echo WARNING.. either will overlay the file just installed by the update
			 echo WARNING..	 
		 fi 
	fi 
	# return to original folder 
	cd - >/dev/null
	date +"Upgrade ended - %a %b %e %H:%M:%S %Z %Y" >>$logfile
else 
	echo It appears MagicMirror has not been installed on this system  
	echo please run the installer, "raspberry.sh" first  
fi 

