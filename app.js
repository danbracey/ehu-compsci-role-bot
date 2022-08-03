import DiscordJS, {
    Intents,
    MessageActionRow,
    MessageEmbed,
    MessageSelectMenu
} from 'discord.js'
import dotenv from 'dotenv'
import * as Sentry from "@sentry/node";
import {getAssociatedModules, getOptionalModules} from './functions.js';
dotenv.config()

Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});

/*
    For the next person that has the misfortune of working on this bot.
    Samaritans UK: 116 123
 */

const client = new DiscordJS.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
})

client.on('ready', () => {
    console.log('EHU Computer Science Bot')
    console.log('This bot is a member of the following servers:')
    const Guilds = client.guilds.cache.map(guild => "Guild ID: " + guild.id + ". Guild name: " + guild.name);
    console.log(Guilds);
})

client.on('interactionCreate', async (interaction) => {
    const { commandName } = interaction;

    if (interaction.isCommand()) {
        if(commandName === 'course') {
            if (interaction.guild.members.cache.get(interaction.user.id).roles.cache.some(role => role.color === 15277667)) {
                await courses(interaction);
            } else {
                const embed = new MessageEmbed()
                    .setDescription("Please select your year group before using this command. You can set this via the /year command as this determines the modules available to you.")
                    .setColor("RED");
                return interaction.reply({ embeds: [embed]});
            }
        }
        if(commandName === 'year') {
            await yearOfStudy(interaction);
        }
        if(commandName === 'accommodation') {
            await accommodation(interaction);
        }
        if(commandName === 'modules') {
            await modules(interaction);
        }
    }

    if (interaction.isSelectMenu()) {
        if (interaction.customId === 'courseSelect' || interaction.customId === 'yearSelect' || interaction.customId === 'accommodationSelect' || interaction.customId === 'moduleSelect') {
            console.log("Deferring Reply");
            await interaction.deferReply(true).then(async (deferred) => {
                let role = interaction.guild.roles.cache.get(interaction.values[0]);
                console.log("Deferred Reply");
                console.log("Removed user's previous courses")

                //Check for compulsory modules
                let count = 0;
                let optional;
                if (interaction.customId === 'courseSelect') {
                    count = await getAssociatedModules(interaction.values[0], interaction)
                }

                //Check for optional modules
                if (interaction.customId === 'courseSelect') {
                    optional = await getOptionalModules(interaction.values[0], interaction)
                }

                if (interaction.customId === 'yearSelect') {
                    interaction.guild.members.cache.get(interaction.user.id).roles.add(interaction.values[0]).catch(e => {console.log(e)});
                    let del = interaction.guild.roles.cache.filter(role => role.color === 15277667)
                    del.forEach(function (element) {
                        if(element.id !== interaction.values[0]) { //Don't remove the role the user has selected
                            interaction.guild.members.cache.get(interaction.user.id).roles.remove(element.id);
                        }
                    });
                }

                if(count > 0) {
                    if(optional) { //Optional Modules were found
                        interaction.editReply({
                            content: "You have been added to the " + role.name + " group! " + count + " associated modules with your course were automatically added to your account.\n" +
                                "It seems we found some optional modules for you. Please click the buttons below for any modules you wish to add.",
                            components: [optional]
                        })
                    } else {
                        interaction.editReply({
                            content: "You have been added to the " + role.name + " group! (" + count + " associated modules with your course were automatically added to your account). No optional modules were found."
                        })
                    }
                } else {
                    interaction.editReply({
                        content: "You have been added to the " + role.name + " group!"
                    })
                }
            });
        }
    }

    if (interaction.isButton(interaction)) {
        const split = interaction.customId.split("#"); //User ID # Module ID
        if (interaction.user.id !== split[0]) {
            const embed = new MessageEmbed()
                .setDescription("You are not permitted to take the roles issued to other users! Please run /course to see the list of available roles.")
                .setColor("RED");
            return interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            interaction.deferReply().then(async (deferred) => {
                console.log("Adding module to user");
                interaction.guild.members.cache.get(interaction.user.id).roles.add(split[1]).catch(console.error);
                //await interaction.guild.members.cache.get(interaction.user.id).roles.add(split[1]);
                console.log("Module added to user");

                interaction.editReply({
                    content: "Module added to your account!"
                })
            });
        }
    }
});



async function courses(interaction) {
    let courses = [];

    //Add all course roles to list
    let find = interaction.guild.roles.cache.filter(role => role.color === 3066993)
    find.forEach(function (element) {
        courses.push({
            name: element.name,
            id: element.id
        });
    });

    try {
        let MenuOptions;
        let selectMenu = new MessageActionRow()
            .addComponents(
                MenuOptions = new MessageSelectMenu()
                    .setCustomId('courseSelect')
                    .setPlaceholder('Select a course...'),
            );

        courses.forEach(function (element) {
            MenuOptions.addOptions([{
                label: element.name,
                value: element.id
            }])
        });

        const questionEmbed = new MessageEmbed()
            .setColor('#5f295f')
            //.setTitle("Please choose your course")
            .setAuthor({name: 'EHU Computer Science', url: 'https://github.com/PenguinNexus/ehu-compsci-role-bot'})
            .setDescription("Welcome to EHU Computer Science. Please select your course.")
            .setTimestamp()
            .setFooter({text: "Made by Dan Bracey"});

        await interaction.reply({
            embeds: [questionEmbed],
            components: [selectMenu]
        })
    } catch (e) {
        interaction.reply({
            content: e,
        })
        console.error(e)
        Sentry.captureException(e, {
            user: {
                id: interaction.user.id,
                username: interaction.user.username
            },
            level: 'fatal'
        })
    }
}

function yearOfStudy(interaction) {
    let years = [];
    let find = interaction.guild.roles.cache.filter(role => role.color === 15277667)
    find.forEach(function (element) {
        years.push({
            name: element.name,
            id: element.id
        });
    });

    try {
        let MenuOptions;
        let selectMenu = new MessageActionRow()
            .addComponents(
                MenuOptions = new MessageSelectMenu()
                    .setCustomId('yearSelect')
                    .setPlaceholder('Select year of study...'),
            );

        years.forEach(function (element) {
            MenuOptions.addOptions([{
                label: element.name,
                value: element.id
            }])
        });

        const questionEmbed = new MessageEmbed()
            .setColor('#5f295f')
            //.setTitle("Please choose your course")
            .setAuthor({name: 'EHU Computer Science', url: 'https://github.com/PenguinNexus/ehu-compsci-role-bot'})
            .setDescription("Please select your year of study (or the year you'll be going into)")
            .setTimestamp()
            .setFooter({text: "Made by Dan Bracey"});

        interaction.reply({
            embeds: [questionEmbed],
            components: [selectMenu]
        })
    } catch(e) {
        interaction.reply({
            content: "Error. Please contact Dan Bracey for assistance.",
        })
        console.error("Unable to reach API")
        Sentry.captureException(e, {
            user: {
                id: interaction.user.id,
                username: interaction.user.username
            },
            level: 'fatal'
        })
    }
}

async function accommodation(interaction) {
    let accommodation = [];
    let find = interaction.guild.roles.cache.filter(role => role.color === 15844367)
    find.forEach(function (element) {
        accommodation.push({
            name: element.name,
            id: element.id
        });
    });

    try {
        let MenuOptions;
        let selectMenu = new MessageActionRow()
            .addComponents(
                MenuOptions = new MessageSelectMenu()
                    .setCustomId('accommodationSelect')
                    .setPlaceholder('Select accommodation...'),
            );

        accommodation.forEach(function (element) {
            MenuOptions.addOptions([{
                label: element.name,
                value: element.id
            }])
        });

        const questionEmbed = new MessageEmbed()
            .setColor('#5f295f')
            //.setTitle("Please choose your course")
            .setAuthor({name: 'EHU Computer Science', url: 'https://github.com/PenguinNexus/ehu-compsci-role-bot'})
            .setDescription("Please select your accommodation")
            .setTimestamp()
            .setFooter({text: "Made by Dan Bracey"});

        //Log the info into the console for debugging purposes
        //console.info(interaction.user.username + " has requested question " + data.id + " in server " + interaction.guild.name)

        await interaction.reply({
            embeds: [questionEmbed],
            components: [selectMenu]
        })
    } catch (e) {
        interaction.reply({
            content: e,
        })
        console.error(e)
        Sentry.captureException(e, {
            user: {
                id: interaction.user.id,
                username: interaction.user.username
            },
            level: 'fatal'
        })
    }
}

async function modules(interaction) {
    //Add all course roles to list
    let modules = [];
    let user = interaction.guild.members.cache.get(interaction.user.id);

    interaction.guild.roles.cache.forEach(function (element) {
        if (user.roles.cache.some(role => role.name === "Year 1")) { //Year 1
            let test = /CIS1/.test(element.name);
            if (test === true) {
                modules.push({
                    name: element.name,
                    id: element.id
                });
            }
        }
        if (user.roles.cache.some(role => role.name === "Year 2")) { //Year 1
            let test = /CIS2/.test(element.name);
            if (test === true) {
                modules.push({
                    name: element.name,
                    id: element.id
                });
            }
        }
        if (user.roles.cache.some(role => role.name === "Year 3")) { //Year 1
            let test = /CIS3/.test(element.name);
            if (test === true) {
                modules.push({
                    name: element.name,
                    id: element.id
                });
            }
        }
        if (user.roles.cache.some(role => role.name === "Year 4")) { //Year 1
            let test = /CIS4/.test(element.name);
            if (test === true) {
                modules.push({
                    name: element.name,
                    id: element.id
                });
            }
        }
    });

try {
        let MenuOptions;
        let selectMenu = new MessageActionRow()
        .addComponents(
            MenuOptions = new MessageSelectMenu()
                .setCustomId('moduleSelect')
                .setPlaceholder('Select module(s)...')
                .setMinValues(1)
                .setMaxValues(25)
        );

        modules.forEach(function (element) {
            MenuOptions.addOptions({
                label: element.name,
                value: element.id
            })
        });

        const questionEmbed = new MessageEmbed()
            .setColor('#5f295f')
            .setTitle("Please choose your modules")
            .setAuthor({name: 'EHU Computer Science', url: 'https://github.com/PenguinNexus/ehu-compsci-role-bot'})
            .setDescription("Please select each module from the drop-down list individually. Available modules listed below are based on your year group. Use /year or go to https://ehu-discord.herokuapp.com to change this.")
            .setTimestamp()
            .setFooter("Made by Dan Bracey");

        await interaction.reply({
            embeds: [questionEmbed],
            components: [selectMenu]
        })
    } catch (e) {
        interaction.reply({
            content: e,
        })
        console.error(e)
        Sentry.captureException(e, {
            user: {
                id: interaction.user.id,
                username: interaction.user.username
            },
            level: 'fatal'
        })
    }
}

client.login(process.env.TOKEN)