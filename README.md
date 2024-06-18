# Docker Setup with X Server Forwarding for Windows

## Prerequisites
- Docker Desktop
- VcXsrv Windows X Server

## Installation & Configuration

1. **Install Docker Desktop for Windows**
   - Download and install from the Docker [website](https://docs.docker.com/desktop/install/windows-install/).

2. **Install VcXsrv Windows X Server**
   - Download [VcXsrv from SourceForge](https://sourceforge.net/projects/vcxsrv/).
   - Run XLaunch, choose your display settings, and ensure "Disable access control" is checked.

3. **Configure Docker - Not always needed**
   - Do this only if you have any issue on the first run
   - In Docker settings, ensure "Expose daemon on tcp://localhost:2375 without TLS" is enabled.

4. **Retrieve IP Address**
   - Open Command Prompt and execute `ipconfig` to find your "IPv4 Address".

5. **Firewall**
    - Set the correct **Firewall Settings** to allow X server forwarding


# Docker with X Server Forwarding on macOS

This guide will walk you through the process of setting up Docker to run containers that can display GUI applications on macOS using X server forwarding.

## Step 1: Install Docker Desktop for Mac

- Download **Docker Desktop for Mac** from the Docker [website](https://docs.docker.com/desktop/install/mac-install/).
- Follow the installation instructions provided by the installer.

## Step 2: Install XQuartz

- Download **XQuartz** from the [XQuartz website](https://www.xquartz.org/).
- Install XQuartz and then restart your computer to ensure the changes take effect.

## Step 3: Configure XQuartz

- Open **XQuartz**.
- In the top menu, go to `XQuartz` > `Preferences`.
- Click on the **Security** tab.
- Check the option **"Allow connections from network clients"**.

## Step 4: Retrieve Your IP Address

- Open the **Terminal** application.
- Type `ifconfig` and press **Enter**.
- Look for the **"inet"** address associated with your active network connection (not the loopback `127.0.0.1`).

## Step 5: Firewall

 - Open the **System Preferences** from the Apple menu
 - Click on **Security & Privacy**
 - Select the **Firewall** tab
 - If the firewall is turned on, click on the lock icon and enter your admin pwd
 - Click on **Firewall Options**
 - Set the correct **Firewall Settings** to allow X server forwarding
 - Re-lock the settings to ensure 

## Step 6: Addittional - in case of extra issues

1.  Add your IP address to the xhost list
- xhost +your_host_ip (replace your_host_ip with the actual IP address of your Mac machine)

# After - common steps to build, test, and run the container

## Clone the repository
1. Create a new folder 
2. In the new folder git clone this repo (use the link)

**If you already downloaded the repo and built locally, you can't use the same folder**

## Building Docker Container

1. Go in the project folder 

2. **Run the command**
    - docker-compose build
  

**As of now, keep your X Server Emulator (Xserver or Qwartz) launched - as explained above**

## Test

1. **Run the container in interactive mode**
 - Run the docker container as follow 
   docker run --rm -it <image_name>
 - Use the following command
   xeyes

## Play

1. **Modify the docker-compose file**
- Go to the docker-compose file
- In the line below environment
- DISPLAY=<YOUR_IP_ADDRESS_HERE>:0, put your IP address in place of YOUR_IP_ADDRESS_HERE
2. **Run the container as expected**
- Run the container as intended
- docker-compose up

# On target - the RASP

## Prepare the Raspberry Pi

1. Update the list of available packages and their version
  - sudo apt-get update
2. Installs Docker and Docker-Compose
  - sudo apt-get install -y docker.io docker-compose 
3. Start the docker service, and ensure it will run on boot
  - sudo systemctl start docker
  - sudo systemctl enable docker
4. The X server manages the graphical display. To allow the Docker container to interact with it, use:
  - xhost +si:localuser:root

## Optional: Use a Non-Root User for Docker
By default, Docker commands require sudo. To run Docker commands without sudo, add your user to the docker group, and later reboot:
  - sudo usermod -aG docker $USER

## Start the mirror
1. Clone the repository in a local folder
2. Manually change the docker-compose file in order to have the following env variable
      - DISPLAY=:0
3. Navigate to the folder
4. Run the container
  - (sudo) docker-compose up

## Optional: debug and test
1. Build the container instead of running it
  - (sudo) docker-compose build
2. Run the container using the following command
  - docker run --rm -e DISPLAY=:0 -v /tmp/.X11-unix:/tmp/.X11-unix x11-apps xeyes
3. Check the logs
  - docker-compose logs











![MagicMirror²: The open source modular smart mirror platform. ](.github/header.png)

<p style="text-align: center">
  <a href="https://choosealicense.com/licenses/mit">
		<img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
	</a>
	<img src="https://img.shields.io/github/actions/workflow/status/magicmirrororg/magicmirror/automated-tests.yaml" alt="GitHub Actions">
	<img src="https://img.shields.io/github/checks-status/magicmirrororg/magicmirror/master" alt="Build Status">
	<a href="https://github.com/MagicMirrorOrg/MagicMirror">
		<img src="https://img.shields.io/github/stars/magicmirrororg/magicmirror?style=social">
	</a>
</p>

**MagicMirror²** is an open source modular smart mirror platform. With a growing list of installable modules, the **MagicMirror²** allows you to convert your hallway or bathroom mirror into your personal assistant. **MagicMirror²** is built by the creator of [the original MagicMirror](https://michaelteeuw.nl/tagged/magicmirror) with the incredible help of a [growing community of contributors](https://github.com/MagicMirrorOrg/MagicMirror/graphs/contributors).

MagicMirror² focuses on a modular plugin system and uses [Electron](https://www.electronjs.org/) as an application wrapper. So no more web server or browser installs necessary!

## Documentation

For the full documentation including **[installation instructions](https://docs.magicmirror.builders/getting-started/installation.html)**, please visit our dedicated documentation website: [https://docs.magicmirror.builders](https://docs.magicmirror.builders).

## Links

- Website: [https://magicmirror.builders](https://magicmirror.builders)
- Documentation: [https://docs.magicmirror.builders](https://docs.magicmirror.builders)
- Forum: [https://forum.magicmirror.builders](https://forum.magicmirror.builders)
  - Technical discussions: https://forum.magicmirror.builders/category/11/core-system
- Discord: [https://discord.gg/J5BAtvx](https://discord.gg/J5BAtvx)
- Blog: [https://michaelteeuw.nl/tagged/magicmirror](https://michaelteeuw.nl/tagged/magicmirror)
- Donations: [https://magicmirror.builders/#donate](https://magicmirror.builders/#donate)

## Contributing Guidelines

Contributions of all kinds are welcome, not only in the form of code but also with regards to

- bug reports
- documentation
- translations

For the full contribution guidelines, check out: [https://docs.magicmirror.builders/about/contributing.html](https://docs.magicmirror.builders/about/contributing.html)

## Enjoying MagicMirror? Consider a donation!

MagicMirror² is opensource and free. That doesn't mean we don't need any money.

Please consider a donation to help us cover the ongoing costs like webservers and email services.
If we receive enough donations we might even be able to free up some working hours and spend some extra time improving the MagicMirror² core.

To donate, please follow [this](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=G5D8E9MR5DTD2&source=url) link.

<p style="text-align: center">
	<a href="https://forum.magicmirror.builders/topic/728/magicmirror-is-voted-number-1-in-the-magpi-top-50"><img src="https://magicmirror.builders/img/magpi-best-watermark-custom.png" width="150" alt="MagPi Top 50"></a>
</p>
