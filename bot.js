const Discord = require('discord.js');
const client = new Discord.Client();

// TODO: check if anyone hasn't been placed in a role and make them gen members
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.content === '!hi') {
        msg.reply('Hi!');
    }
});

/*
client.on('message', msg => {
    if (msg.content === '!role') {
        msg.member.roles.set(['108260861193265152'])
            .then(msg => console.log(`Set new member ${msg.member.user.tag} as general member`))
            .catch(console.error);
    }
})
*/

// TODO: reminder system
/*
    format: !remind [users to be reminded] [date+time] [message]
    1. get user ids? (not sure if want to do @ for each name or just type current nickname)
    2. store date + time, users, message (what to store in?)
    3. send reminder (https://www.npmjs.com/package/cron)
        need to figure out how i should be checking time for reminders (https://www.npmjs.com/package/cron)
*/
client.on('message', msg => {
    var cmd = msg.content.split(" ");
    if (cmd[0] === "!remind") {
        // var time = Date.now();
    }
})

// auto set new member to role (<@&108260861193265152>)
// \@[rolename] to get role id
client.on('guildMemberAdd', member => {
    member.roles.set(['108260861193265152'])
        .then(member => console.log(`Set new member ${member.user.tag} as general member`))
        .catch(console.error);

    channel.send(`Welcome to the server, ${member}`);
});

client.login('');
