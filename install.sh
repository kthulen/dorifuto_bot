#!/bin/bash

sudo apt update
sudo apt -y upgrade
curl -sL https://deb.nodesource.com/setup_12.16.1 | sudo -E bash -
sudo apt install -y nodejs
npm install discord.js cron
