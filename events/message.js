/**
 * @file message event
 * @author Sankarsan Kampa (a.k.a k3rn31p4nic)
 * @license MIT
 */

const credentialsFilter = require('../utils/credentialsFilter');
const wordFilter = require('../utils/wordFilter');
const linkFilter = require('../utils/linkFilter');
const inviteFilter = require('../utils/inviteFilter');
const handleTrigger = require('../handlers/triggerHandler');
const handleUserLevel = require('../handlers/levelHandler');
const handleCommand = require('../handlers/commandHandler');
const handleConversation = require('../handlers/conversationHandler');
const handleDirectMessage = require('../handlers/directMessageHandler');
let recentLevelUps = [];
let recentUsers = {};

module.exports = async message => {
  /**
   * Filter Bastion's credentials from the message
   */
  credentialsFilter(message);

  /**
   * If the message author is a bot, ignore it.
   */
  if (message.author.bot) return;

  if (message.guild) {
    /**
     * Filter specific words from the message
     */
    wordFilter(message);

    /**
     * Filter links from the message
     */
    linkFilter(message);

    /**
     * Filter Discord server invites from the message
     */
    inviteFilter(message);

    try {
      if (!message.channel.permissionsFor(message.member).has('MANAGE_ROLES')) {
        let guildSettings = await message.client.db.get(`SELECT slowMode FROM guildSettings WHERE guildID=${message.guild.id}`);
        if (guildSettings && guildSettings.slowMode) {
          if (recentUsers.hasOwnProperty(message.author.id)) {
            let title, description;

            ++recentUsers[message.author.id];
            if (recentUsers[message.author.id] >= 5) {
              title = 'Warned ya!.';
              description = `${message.author} you have been muted for 5 minutes.`;
              await message.channel.overwritePermissions(message.author, {
                SEND_MESSAGES: false,
                ADD_REACTIONS: false
              });

              setTimeout(function () {
                let permissionOverwrites = message.channel.permissionOverwrites.get(message.author.id);
                if (permissionOverwrites) {
                  if (permissionOverwrites.deny === 2112) {
                    permissionOverwrites.delete();
                  }
                  else {
                    message.channel.overwritePermissions(message.author, {
                      SEND_MESSAGES: null,
                      ADD_REACTIONS: null
                    }).catch(e => {
                      message.client.log.error(e);
                    });
                  }
                }
              }, 5 * 60 * 1000);
            }
            else if (recentUsers[message.author.id] >= 4) {
              title = 'Cooldown, dark lord.';
              description = `${message.author} you are sending messages way too quickly.`;
            }
            else if (recentUsers[message.author.id] >= 3) {
              title = 'Woah There. Way too Spicy.';
              description = `${message.author} you are sending messages too quickly.`;
            }

            if (title && description) {
              await message.channel.send({
                embed: {
                  color: message.client.colors.ORANGE,
                  title: title,
                  description: description
                }
              });
            }
          }
          else {
            recentUsers[message.author.id] = 1;

            setTimeout(function () {
              delete recentUsers[message.author.id];
            }, 5 * 1000);
          }
        }
      }
    }
    catch (e) {
      message.client.log.error(e);
    }

    /**
     * Check if the message contains a trigger and respond to it
     */
    handleTrigger(message);

    try {
      let users = await message.client.db.all('SELECT userID FROM blacklistedUsers');
      if (users.map(u => u.userID).includes(message.author.id)) return;
    }
    catch (e) {
      message.client.log.error(e);
    }

    /**
    * Cooldown for experience points, to prevent spam
    */
    if (!recentLevelUps.includes(message.author.id)) {
      recentLevelUps.push(message.author.id);
      setTimeout(function () {
        recentLevelUps.splice(recentLevelUps.indexOf(message.author.id), 1);
      }, 20 * 1000);
      /**
      * Increase experience and level up user
      */
      handleUserLevel(message);
    }

    /**
    * Handles Bastion's commands
    */
    handleCommand(message);

    /**
    * Check if the message starts with mentioning Bastion
    */
    if (message.content.startsWith(`<@${message.client.credentials.botId}>`) || message.content.startsWith(`<@!${message.client.credentials.botId}>`)) {
      /**
      * Handles conversations with Bastion
      */
      handleConversation(message);
    }
  }
  else {
    /**
     * Handles direct messages sent to Bastion
     */
    handleDirectMessage(message);
  }
};
