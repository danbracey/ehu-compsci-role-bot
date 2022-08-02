import { createRequire } from "module";
import {ButtonStyle} from "discord-api-types/v8";
import {MessageActionRow, MessageButton, MessageButton as ButtonBuilder, User} from "discord.js"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const courses = require("./courses.json") // use the require method

function getYearGroup(interaction) {
    let user = interaction.guild.members.cache.get(interaction.user.id);
    //get user's year group
    if (user.roles.cache.some(role => role.name === "Year 1")) {
        return "1";
    } else if (user.roles.cache.some(role => role.name === "Year 2")) {
        return "2";
    } else if (user.roles.cache.some(role => role.name === "Year 3")) {
        return "3";
    } else if (user.roles.cache.some(role => role.name === "Year 4")) {
        return "4";
    } else {
        return "1"; //If user has no year group, default to year 1 (Although user should never be able to reach this point)
    }
}

export async function getAssociatedModules(course, interaction) {
    console.info("Started to search for Associated Modules with course " + course);
    if (typeof courses.courses[course.toString()] === "undefined") {
        return -1; //Unable to find course
    } else {
        //Get IDs of user's current roles
        let userRoles = [];
        interaction.guild.members.cache.get(interaction.user.id).roles.cache.forEach(role => {
            userRoles.push(role.id);
        });

        let modules = courses.courses[course.toString()][getYearGroup(interaction)];

        //Delete other modules
        let count = 0;
        let del = interaction.guild.members.cache.get(interaction.user.id).roles.cache.filter(role => role.color === 10181046);
        let index;
        del.forEach(role => {
                index = userRoles.indexOf(role.id);
                userRoles.splice(index, 1);
                count++;
        });

        console.info("Deleted " + count + " previous modules");

        //Add new modules to list of 'current' roles
        if(modules) {
            for(let i = 0; i < modules.length; i++) {
                if(!userRoles.includes(modules[i])) {
                    userRoles.push(modules[i]);
                }
            }

            console.info("Finished searching for Associated Modules with course " + course + " and found " + modules.length + " modules");
        } else {
            console.info("Finished searching for Associated Modules with course " + course + " and found no available modules");
        }

        //Add the course to user
        userRoles.push(course);
        //Remove any other courses once the reply has been sent to user (to avoid timeout)
        del = interaction.guild.members.cache.get(interaction.user.id).roles.cache.filter(role => role.color === 3066993)
        del.forEach(function (role) {
            if(role.id !== interaction.values[0]) { //Don't remove the role the user has selected
                let index;
                index = userRoles.indexOf(role.id);
                userRoles.splice(index, 1);
            }
        });

        //Add the 'Student' role if the user doesn't currently have it
        if(!userRoles.includes("963370609566433330")) {
            userRoles.push("963370609566433330");
        }

        //Remove the 'Everyone' role from the set
        index = userRoles.indexOf("878622701391081472");
        userRoles.splice(index, 1);

        interaction.guild.members.cache.get(interaction.user.id).roles.set(userRoles);

        if(modules) {
            return modules.length;
        } else {
            return 0;
        }
    }
}

export async function getOptionalModules(course, interaction) {
    console.info("Started to search for Optional Modules with course " + course);
    let user = interaction.guild.members.cache.get(interaction.user.id);

    let count = 0;

    if (typeof courses.courses[course] !== "undefined") {
        if (typeof courses.courses[course]["optional"] !== "undefined") {
            const row = new MessageActionRow();

            for (let i = 0; i < 5; i++) {
                if (typeof courses.courses[course]["optional"][getYearGroup(interaction)][i] !== "undefined") {
                    let role = interaction.guild.roles.cache.find(role => role.id === courses.courses[course]["optional"][getYearGroup(interaction)][i]);
                    row.addComponents(
                        new MessageButton()
                            .setCustomId(user.id + "#" + role.id)
                            .setLabel(role.name)
                            .setStyle(ButtonStyle.Primary),
                    );
                    count++;
                }
            }

            if (count > 0) {
                return row;
            } else {
                return null;
            }
        }
    }

    console.info("Finished searching for Optional Modules with course " + course + " and found " + count + " modules");
    return count;
}

function unique(a) {
    var seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}