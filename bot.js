const Discord = require('discord.js');
const CronJob = require('cron').CronJob;

const client = new Discord.Client();

// TODO: check error handling, testing

// TODO: on startup, auto role anyone who doesn't have a role
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.content === "!hi") {
        msg.reply("Hi!");
    }
});

client.on('message', msg => {
    if (msg.content === "!cmd") {
        msg.reply(`Commands:
            1. !hi:     bot says hi
            2. !remind: dm message to all users tagged
                        usage: !remind [user1 user2...] [date] [time] [message]
                        example: !remind @guy @dude @homie 04/20/6969 14:00 howdy gamers
            3. !vote: Set up a vote. When not specified, the title is 'Poll', the options are 'Yay' and 'Nay', and the timer is 2 minutes.
                      While a vote is ongoing, voters can add options and
                      usage: !vote (-t title) (-o {option1} {option 2}...)
                      example: !vote -s Who to kick from the island -t 5:00 -o {Son Goku} {Naruto}
                               **Voting has begun for 5:00**
                               !vote -o Dinkleburg
                               ***Dinkleburg*** **added as a candidate**
                               !vote Son Goku
                               !vote -end
                               **Voting ended early**
            `);
    }
});

// reminder system
client.on('message', msg => {
    let cmd = msg.content.split(" ");
    let data = new Array (3)
    if (cmd[0] === "!remind") {
        try {
            let usrs = [];
            let done = false;
            let i = 1;
            while(done === false) {
                if (cmd[i].startsWith("<@!")) { usrs.push(cmd[i]); }
                else { done = true; }
                i++;
            }
            data[0] = usrs;

            data[1] = cmd[i+1] + " " + cmd[i+2];
            cmd = cmd.splice(i+3);
            data[2] = cmd.join(" ");

            let date = new Date(data[1]);
            const reminder = new CronJob(date, function() {
                for (let id of data[0]) {
                    id = id.replace(/[<@!>]/g,"");
                    client.users.fetch(id)
                        .then(u => u.createDM()
                            .then(dm => dm.send(data[2]))
                            .catch(e => console.error(e)))
                        .catch(console.error);
                }
            });

            reminder.start();
            msg.reply("You got it boss!");
        }
        catch(e) {
            console.log("\nreminder command failed");
            console.error(e);
            msg.reply(`Mission failed. We'll get 'em next time.
                usage: !remind [user1 user2...] [date] [time] [message]
                example: !remind @guy @dude @homie 04/20/6969 14:00 howdy gamers`);
        }
    }
});

// TODO: voting system
// TODO: make sure each user's vote is counted once
client.on('message', msg => {
    let cmd = msg.content.split(" ");
    if (cmd[0] === "!vote") {
        let title = "Poll"
        if (cmd.length > 1) { title = cmd.splice(1).join(" ") }

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

// auto set new member to role (<@&108260861193265152>)
// \@[rolename] to get role id
client.on('guildMemberAdd', member => {
    member.roles.set(['108260861193265152'])
        .then(member => console.log(`Set new member ${member.user.tag} as general member`))
        .catch(e => console.error(e));

    channel.send(`Welcome to the server, ${member}`);
});

client.login('');
