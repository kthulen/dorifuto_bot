const Discord = require('discord.js');
const CronJob = require('cron').CronJob;

const client = new Discord.Client();

// TODO: check error handling, testing

// TODO: on startup, auto role anyone who doesn't have a role
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.content === '!hi') {
        msg.reply('Hi!');
    }
});

client.on('message', msg => {
    if (msg.content === '!cmd') {
        msg.reply(`Commands:
            1. !hi:     bot says hi
            2. !remind: dm message to all users tagged
                        usage: !remind [users] [date] [time] [message]
                        example: !remind @guy,@dude,@homie 04/20/6969 14:00 howdy gamers
            `);
    }
});

client.on('message', msg => {
    var cmd = msg.content.split(" ");
    var data = new Array (3)
    if (cmd[0] === "!remind") {
        try {
            data[0] = cmd[1].split(",");
            data[1] = cmd[2] + " " + cmd[3];
            cmd = cmd.splice(4);
            data[2] = cmd.join(' ');

            var date = new Date(data[1]);
            const reminder = new CronJob(date, function() {
                for (var id of data[0]) {
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
                usage: !remind [users] [date] [time] [message]
                example: !remind @guy,@dude,@homie 04/20/6969 14:00 howdy gamers`);
        }
    }
})


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
