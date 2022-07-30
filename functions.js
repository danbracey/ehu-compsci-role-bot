import { createRequire } from "module";
import {ButtonStyle} from "discord-api-types/v8";
import {MessageActionRow, MessageButton, MessageButton as ButtonBuilder} from "discord.js"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const courses = require("./courses.json") // use the require method

export async function getAssociatedModules(course, interaction) {
    console.info("Started to search for Associated Modules with course " + course);
    let user = interaction.guild.members.cache.get(interaction.user.id);
    let count = 0;

    if (user.roles.cache.some(role => role.name === "Year 1")) {
        if(typeof courses.courses[course] !== "undefined") {
            courses.courses[course]["1"].forEach(function (module, i) {
                user.roles.add(interaction.guild.roles.cache.find(role => role.id === module.toString())).catch(console.error);
                count = i;
            });
        }
    }
    if (user.roles.cache.some(role => role.name === "Year 2")) {
        if(typeof courses.courses[course] !== "undefined") {
            courses.courses[course]["2"].forEach(function (module, i) {
                user.roles.add(interaction.guild.roles.cache.find(role => role.id === module.toString())).catch(console.error);
                count = i;
            });
        }
    }
    if (user.roles.cache.some(role => role.name === "Year 3")) {
        if(typeof courses.courses[course] !== "undefined") {
            courses.courses[course]["3"].forEach(function (module, i) {
                user.roles.add(interaction.guild.roles.cache.find(role => role.id === module.toString())).catch(console.error);
                count = i;
            });
        }
    }
    if (user.roles.cache.some(role => role.name === "Year 4")) {
        if(typeof courses.courses[course] !== "undefined") {
            courses.courses[course]["4"].forEach(module, i => {
                user.roles.add(interaction.guild.roles.cache.find(role => role.id === module.toString())).catch(console.error);
                count = i;
            });
        }
    }

    console.info("Finished searching for Associated Modules with course " + course);
    return count;
}

export async function getOptionalModules(course, interaction) {
    console.info("Started to search for Optional Modules with course " + course);
    let user = interaction.guild.members.cache.get(interaction.user.id);
    let count = 0;

    if(typeof courses.courses[course] !== "undefined") {
        if (typeof courses.courses[course]["optional"] !== "undefined") {
            const row = new MessageActionRow();

            for(let i = 0; i < 4; i++) {
                if(typeof courses.courses[course]["optional"][i] !== "undefined") {
                    let role = interaction.guild.roles.cache.find(role => role.id === courses.courses[course]["optional"][i]);
                    row.addComponents(
                        new MessageButton()
                            .setCustomId(user.id + "#" + role.id)
                            .setLabel(role.name)
                            .setStyle(ButtonStyle.Primary),
                    );
                    count++;
                }
            }

            if(count > 0) {
                return row;
            } else {
                return null;
            }
        }
    }


    console.info("Finished searching for Optional Modules with course " + course);
    return count;
}