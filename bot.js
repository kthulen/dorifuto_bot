const Discord = require('discord.js');
const CronJob = require('cron').CronJob;
const fs = require('fs');
const config = require('./config.json');

const client = new Discord.Client();
const commands = ['!hi', '!cmd', '!remind', '!vote'];
let voteActive = false;

// TODO: check error handling, testing
// NOTE: change config.bot_testing to config.bot_channel when ready to use

// parses a single option and returns it as a string along with the number of words in it
function parseOptions(arr) {
    let str = [];
    let i = 0;

    do {
        str.push(arr[i]);
        i++;
    } while (arr[i - 1].endsWith('}') === false &&
        arr[i].startsWith('-') === false &&
        i != arr.length);

    str = str.join(' ').replace(/[{}]/g, '');
    return { string: str, count: i };
}

// check if string contains any commands
function checkCommands(string) {
    let hasCommand = false;

    for (let command of commands) {
        let expr = new RegExp(command);
        if (expr.test(string) === true) {
            hasCommand = true;
            break;
        }
    }

    return hasCommand;
}

// TODO: on startup, auto role anyone who doesn't have a role
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.content === '!hi' && msg.channel.id === config.bot_testing) {
        msg.reply('Hi!');
    }
});

// info on usage
client.on('message', msg => {
    if (msg.content === '!cmd' && msg.channel.id === config.bot_testing) {
        msg.channel.send(`Commands:
            1. !hi:     bot says hi
            2. !remind: dm message to all users tagged
                        usage: !remind [user1 user2...] [date] [time] [message]
                        example: !remind @guy @dude @homie 04/20/6969 14:00 howdy gamers
            3. !vote: Set up a vote. When not specified, the title is 'Poll', the options are 'Yay' and 'Nay', and the timer is 2 minutes.
                      While a vote is ongoing, voters can add options and
                      usage: !vote (-s subject) (-t time) (-o {option1} {option 2}...)
                      example: !vote -s Who to kick from the island -t 5:00 -o {Son Goku} {Naruto}
                                **Voting has begun for 5:00**
                                !vote -o Dinkleburg
                                ***Dinkleburg*** **added as a candidate**
                                !vote Son Goku
                                !vote -end
                                **Voting ended early**
            4. !count: Create or increment existing counters saved to a local file.
                       usage: !count [item or -a]
                       example: !count deaths
                                **deaths** count: 1
                                !count deaths
                                **deaths** count: 2
                                !count save
                                **save** count: 1
                                !count -a
                                **deaths** count: 2
                                **save** count: 1
            `);
    }
});

// delete message and DM user if commands are issued in the wrong channel
client.on('message', msg => {
    if (msg.channel.id !== config.bot_testing && checkCommands(msg.content) === true) {
        msg.delete()
            .then(console.log('Deleted message posted on wrong channel'))
            .catch(console.error);
        msg.author.send('You can only use commands in the bot-command channel!');
    }
});

// creates and increments counters stored in a local JSON file
client.on('message', msg => {
    let cmd = msg.content.split(/ +/);

    if (cmd[0] === '!count' && msg.channel.id === config.bot_testing && cmd.length != 2) {
        let counters = {};

        fs.readFile('./counter.json', (err, data) => {
            if (err) {
                console.log('Failed to read counter.json.');
            }
            else {
                try {
                    counters = JSON.parse(data);
                    console.log(JSON.stringify(counters));
                }
                catch(e) {
                    console.log(`${e}\nFailed to retrieve counter from file.`);
                }
            }

            // don't write to file, just print all
            if (cmd[1] === '-a') {
                if (counters === {}) {
                    msg.channel.send('There aren\'t any counts right now.');
                }
                else {
                    let allCounters = '';
                    for (let key in counters) {
                        console.log(key, counters[key]);
                        allCounters = allCounters.concat('**', key, '**', ' count: ', counters[key].toString(), '\n');
                    }
                    msg.channel.send(allCounters);
                }
                return;
            }
            else if (Object.prototype.hasOwnProperty.call(counters, cmd[1])) {
                counters[cmd[1]]++;
            }
            else {
                counters[cmd[1]] = 1;
            }

            msg.channel.send(`**${cmd[1]}** count: ${counters[cmd[1]]}`);

            // overwrite file with new count
            fs.writeFile('counter.json', JSON.stringify(counters), (err) => {
                if (err) {
                    console.log(err);
                }
                console.log('Updated counter and saved to file.');
            });
        });
    }
});

// reminder system
client.on('message', msg => {
    let cmd = msg.content.split(/ +/);
    let data = new Array (3);
    if (cmd[0] === '!remind' && msg.channel.id === config.bot_testing) {
        let users = [];
        let done = false;
        let i = 1;

        // TODO: break up try/catch for better logging/handling
        try {
            while(done === false) {
                if (cmd[i].startsWith('<@!')) { users.push(cmd[i]); }
                else { done = true; }
                i++;
            }
            data[0] = users;

            data[1] = cmd[i + 1] + ' ' + cmd[i + 2];
            cmd = cmd.splice(i + 3);
            data[2] = cmd.join(' ');

            const date = new Date(data[1]);
            const reminder = new CronJob(date, function() {
                for (let id of data[0]) {
                    id = id.replace(/[<@!>]/g, '');
                    client.users.fetch(id)
                        .then(u => u.createDM()
                            .then(dm => dm.send(data[2]))
                            .catch(e => console.error(e)))
                        .catch(console.error);
                }
            });

            reminder.start();
            msg.channel.send('You got it boss!');
        }
        catch(e) {
            console.log('\nreminder command failed');
            console.error(e);
            msg.channel.send(`Mission failed. We'll get 'em next time.
                usage: !remind [@user1 @user2...] [date] [time] [message]`);
        }
    }
});

// TODO: voting system
// TODO: switch from using splice() to indexes like a sensible human
// usage: !vote (-s subject) (-t time) (-o {option1} {option 2}...)
client.on('message', msg => {
    let cmd = msg.content.split(/ +/);
    if (cmd[0] === '!vote' && msg.channel.id === config.bot_testing) {
        let title = 'Poll';
        // 5 min = 30000 ms
        let time = 30000;
        let poll = {
            'yes': 0,
            'no': 0
        };

        // probably make this a function for readability
        if (cmd.length > 1) {
            let str = [];
            let obj = {};
            let min = 0;
            let sec = 0;
            cmd = cmd.splice(1);

            while (cmd.length != 0) {
                console.log(cmd);
                switch(cmd[0]) {
                    case '-s':
                        cmd = cmd.splice(1);

                        // parse up to next option or end of command
                        while (cmd[0].startsWith('-') === false) {
                            str.push(cmd[0]);
                            cmd = cmd.splice(1);
                            if (cmd.length === 0) { break; }
                        }

                        title = str.join(' ');
                        break;

                    case '-t':
                        min = cmd[1].split(':')[0] * 60000;
                        sec = cmd[1].split(':')[1] * 1000;
                        time = min + sec;
                        cmd = cmd.splice(2);
                        break;

                    case '-o':
                        cmd = cmd.splice(1);

                        while (cmd[0].startsWith('-') === false) {

                            try {
                                obj = parseOptions(cmd);
                            }
                            catch {
                                console.log('no options were specified');
                                break;
                            }
                            cmd = cmd.splice(obj.count);
                            poll[obj.string] = 0;
                            if (cmd.length === 0) { break; }
                        }

                        delete poll.yes;
                        delete poll.no;
                        break;

                    // NOTE: leaving this until testing is finished
                    default:
                        console.log('Not sure how we got here but here we are.');
                        cmd = [];
                }
            }
        }
        console.log(`title: ${title}
time (ms): ${time}
options: ${JSON.stringify(poll, null, 4)}\n`);
        // TODO: implement method to accept votes
        // TODO: make sure each user's vote is counted once
    }
});


/*
// test for making the bot change someone's role
// bot must be above whoever it wants to give a role
client.on('message', msg => {
    if (msg.content === '!role') {
        msg.member.roles.set(['108260861193265152'])
            .then(msg => console.log(`Set new member ${msg.member.user.tag} as general member`))
            .catch(console.error);
    }
})
*/

// auto set new member to role
// \@[rolename] to get role id
client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.find(ch => ch.name === 'bot-commands');
    member.roles.set([config.general_channel])
        .then(mem => console.log(`Set new member ${mem.user.tag} as general member`))
        .catch(e => console.error(e));

    channel.send(`Welcome to the server, ${member}`);
});

client.login(config.token);
