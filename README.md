# README

This is a discord bot for my friends and I to use. It's mainly just a pet
project of mine. It's still a WIP.
Written using the discord.js API

## Ideas

*  ~auto role~
*  ~reminder system~
*  probuilds linking
    + need to parse for spaces, special characters
*  mailing list?
*  ~voting~
*  text commands
*  meme database?
*  random champion generator
* ~counter~

## Installation and Setup

1. put the folder in downloads and don't rename it (or make sure it's named dorifuto_bot)
2. open bot.js in a text editor (notepad should be fine but something like notepad++ is preferable)
3. the last line in the file should say `client.login('')` -- ask me for the token and paste it inside the ''
4. install wsl ubuntu in the microsoft store and open it
5. type:

~~~
ln -s /mnt/c/Users/[user]/Downloads/dorifuto_bot dorifuto_bot
cd dorifuto_bot
chmod u+x
./install.sh
~~~

_Note that [user] is your Windows username. You can find this in C:\Users._

## Running the Bot

1. open wsl ubuntu
2. type `cd dorifuto_bot`
3. type  `node bot.js`
