const Discord = require('discord.js');
const CronJob = require('cron').CronJob;
const fs = require('fs');
const config = require('./config.json');
const client = new Discord.Client();

const commands = ['!hi', '!cmd', '!remind', '!vote', '!count'];
let voteActive = false;
// needs to be global in case user decides to end vote early
let voteJob;
let voteObj = {
    title: 'Poll',
    time: 30000,
    options: {
        'yes': 0,
        'no': 0,
    },
};
// store voter id and option so each person can only vote for one option
let voters = {};

/*
    TODO: error handling, try/catch where needed
    TODO: put function in separate files for modularity
            <https://github.com/HarutoHiroki/Discord.js-Bot>
    TODO: parse commands with commander/yargs package
            <https://github.com/tj/commander.js/>
            <https://github.com/yargs/yargs>
    TODO: voting probably needs to be async but im dumb
*/

// check if string contains any commands
function checkCommands(string) {
    let hasCommand = false;

    for (const command of commands) {
        if (string.startsWith(command) === true) {
            hasCommand = true;
            break;
        }
    }

    return hasCommand;
}

// split value at index
function splitIndex(value, index) {
    return [value.substring(0, index), value.substring(index)];
}

// check if input is a valid option in voteObj.options
function isOption(input) {
    let isValid = false;

    for (const option in voteObj.options) {
        if (option === input) {
            isValid = true;
        }
    }

    return isValid;
}

// parses a single option and returns it as a string along with the number of words in it
function parseOptions(arr, index) {
    let str = [];
    // index doubles as number of words;
    let i = 0;

    do {
        str.push(arr[index + i]);
        i++;
    } while (arr[index + i - 1].endsWith('}') === false &&
        arr[index + i].startsWith('-') === false &&
        i != arr.length - index);

    str = str.join(' ').replace(/[{}]/g, '');
    return { string: str, count: i };
}

// TODO: make the announcement an embed
// return string containing voteObj's values used to announce that voting has begun
function voteAnnounce() {
    const time = new Date(voteObj.time);
    const min = time.getUTCMinutes();
    let sec = time.getUTCSeconds();
    let options = '';

    if (sec < 10) {
        sec = '0' + sec;
    }

    for (let option of Object.keys(voteObj.options)) {
        options = options.concat(option, '\n', '    ');
    }

    return `**Vote for ${voteObj.title} will last for ${min}:${sec}.**
    **options:**
    ${options}`;
}

// TODO: on startup, auto role anyone who doesn't have a role
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.content === '!hi' && msg.channel.id === config.bot_channel) {
        msg.reply('Hi!');
    }
});

// set voting values back to default
function defaultVote() {
    voteObj.title = 'Poll';
    voteObj.time = 30000;
    voteObj.options = {
        'yes': 0,
        'no': 0,
    };
}

// go through input and load into voteObj
function initVote(input) {
    let len = input.length;
    let obj = {};
    let index = 1;
    let success = true;

    while (index < input.length) {
        // parse up to next option or end of command
        switch(input[index]) {
            case '-s':
                index++;
                voteObj.title = '';

                while (input[index].startsWith('-') === false) {
                    voteObj.title += input[index] + ' ';
                    index++;
                    if (index >= len) { break; }
                }

                voteObj.title = voteObj.title.trim();
                break;

            case '-t':
                index++;
                voteObj.time = input[index].split(':')[0] * 60000 +
                    input[index].split(':')[1] * 1000;
                index++;
                break;

            case '-o':
                index++;

                while (input[index].startsWith('-') === false) {

                    try {
                        obj = parseOptions(input, index);
                    }
                    catch {
                        console.log('no options were specified');
                        break;
                    }

                    index += obj.count;
                    // set count of option to 0
                    voteObj.options[obj.string] = 0;
                    if (index >= len) { break; }
                }

                // user entered options, so remove default options
                delete voteObj.options.yes;
                delete voteObj.options.no;
                break;

            // NOTE: leaving this until testing is finished
            default:
                input = [];
                success = false;
        }
    }
    return success;
}

function calcVoteResults(channel) {
    let winner = [];
    let winnerCount = 0;

    // determine winner/tie
    for (const option in voteObj.options) {
        if (voteObj.options[option] > winnerCount) {
            winner = [option];
            winnerCount = voteObj.options[option];
        }
        else if (voteObj.options[option] === winnerCount && winnerCount != 0) {
            winner.push(option);
        }
    }

    channel.send('Voting has ended.');

    // print results
    if (winner.length > 1) {
        let winnerString = 'Tie between:';
        for (const option of winner) {
            winnerString += '\n' + option;
        }
        channel.send(winnerString);
    }
    else if (winner.length === 0) {
        channel.send('No one voted, so nothing won!');
    }
    else {
        channel.send(`${winner[0]} won.`);
    }

    voteActive = false;
    defaultVote();
}

// start accepting votes
function voteStart(channel) {
    const date = new Date(Date.now() + voteObj.time);
    voteJob = new CronJob(date, function() {
        // on voting finish
        calcVoteResults(channel);
    });

    voteActive = true;
    voteJob.start();
    channel.send(voteAnnounce());
    console.log(`title: ${voteObj.title}
time (ms): ${voteObj.time}
options: ${JSON.stringify(voteObj.options, null, 4)}\n`);
}

// info on usage
client.on('message', msg => {
    if (msg.content === '!cmd' && msg.channel.id === config.bot_channel) {
        msg.channel.send(`Commands:
            1. !hi:     bot says hi
            2. !remind: dm message to all users tagged
                        usage: !remind [user1 user2...] [date] [time] [message]
                        example: !remind @guy @dude @homie 04/20/6969 14:00 howdy gamers
            3. !vote: Set up a vote. When not specified, the title is 'Poll', the options are 'Yay' and 'Nay', and the timer is 2 minutes.
                      While a vote is ongoing, voters can either cast a vote or end the vote early.
                      usage: !vote (-s subject) (-t time) (-o {option1} {option 2}...) (-end)
                      example: !vote -s Who to kick from the island -t 5:00 -o {Son Goku} {Naruto}
                                **Vote for Who to kick from the island will last for 5:00.**
                                **options:** ...
                                !vote Son Goku
                                *Vote accepted.*
                                !vote -end
                                *Voting has ended.*
                                *Son Goku won.*
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
    if (msg.channel.id !== config.bot_channel && checkCommands(msg.content) === true) {
        msg.delete()
            .then(console.log('Deleted message posted on wrong channel'))
            .catch(console.error);
        msg.author.send('You can only use commands in the bot-command channel!');
    }
});

// counter system
// creates and increments counters stored in a local JSON file or prints all counters
client.on('message', msg => {
    // parsing for '!count ' (including space), so split at index 7
    let cmd = splitIndex(msg.content.trim(), 7);
    cmd[0] = cmd[0].substring(0, cmd[0].length - 1);

    if (cmd[0] === '!count' &&
        msg.channel.id === config.bot_channel &&
        cmd[1] != '') {

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
                if (Object.keys(counters).length === 0) {
                    msg.channel.send('There aren\'t any counts right now.');
                }
                else {
                    let allCounters = '';

                    for (const key in counters) {
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
    else if (cmd[0] === '!count' && cmd[1] === '') {
        msg.reply('count what?');
    }
});

// reminder system
client.on('message', msg => {
    let cmd = msg.content.split(/ +/);
    let data = new Array (3);

    if (cmd[0] === '!remind' && msg.channel.id === config.bot_channel) {
        let users = [];
        let done = false;
        let i = 1;

        // TODO: break up try/catch for better logging/handling
        try {
            while(!done) {
                if (cmd[i].startsWith('<@!')) {
                    users.push(cmd[i]);
                }
                else {
                    done = true;
                }
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

// voting system
// usage: !vote (-s subject) (-t time) (-o {option1} {option 2}...) (-end)
client.on('message', msg => {
    let cmd = msg.content.split(/ +/);
    let option = msg.content.split(/ +/).splice(1).join(' ');

    if (cmd[0] === '!vote' && msg.channel.id === config.bot_channel) {
        if (!voteActive && cmd.length > 0) {
            // set up vote with user settings
            if (initVote(cmd)) {
                voteStart(msg.channel);
            }
            else {
                msg.channel.send('Invalid syntax. There is no active vote.');
            }
        }
        else if (!voteActive) {
            // start the default vote
            voteStart(msg.channel);
        }
        else if (option === '-end') {
            calcVoteResults(msg.channel);
            voteJob.stop();
        }
        else if (!isOption(option)) {
            msg.reply('Invalid option.');
        }
        // user has voted, so retract old vote and cast new vote
        else if (Object.prototype.hasOwnProperty.call(voters, msg.author.id)) {
            voteObj.options[voters[msg.author.id]]--;
            voteObj.options[option]++;
            voters[msg.author.id] = option;
            msg.channel.send('Vote changed and accepted.');
        }
        // user has not voted, so cast vote
        else {
            voteObj.options[option]++;
            voters[msg.author.id] = option;
            msg.channel.send('Vote accepted.');
        }
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
