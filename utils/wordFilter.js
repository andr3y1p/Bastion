/**
 * @file wordFilter
 * @author Sankarsan Kampa (a.k.a k3rn31p4nic)
 * @license MIT
 */

/**
 * Handles filtering of specific words in messages
 * @param {Message} message Discord.js message object
 * @returns {void}
 */
module.exports = async message => {
  try {
    let query = `SELECT filterWord, filteredWords, wordFilterWhitelistChannels, wordFilterWhitelistRoles FROM guildSettings LEFT OUTER JOIN whitelists ON guildSettings.guildID = whitelists.guildID WHERE guildSettings.guildId='${message.guild.id}'`;
    let guild = await message.client.db.get(query);

    if (!guild.filterWord) return;
    // If the channel is whitelisted, return
    if (guild.wordFilterWhitelistChannels) {
      let whitelistChannels = guild.wordFilterWhitelistChannels.split(' ');
      if (whitelistChannels.includes(message.channel.id)) return;
    }
    // If the user is in a whitelisted role, return
    if (guild.wordFilterWhitelistRoles) {
      let whitelistRoles = guild.wordFilterWhitelistRoles.split(' ');
      for (let whitelistRole of whitelistRoles) {
        if (message.member.roles.has(whitelistRole)) return;
      }
    }
    // If the user is an admin, return
    if (message.guild.members.get(message.author.id).hasPermission('ADMINISTRATOR')) return;

    let filteredWords = [];
    if (guild.filteredWords) {
      filteredWords = guild.filteredWords.split(' ');
    }
    for (let word of filteredWords) {
      if (message.content.toLowerCase().includes(word.toLowerCase())) {
        if (message.deletable) {
          return message.delete().catch(e => {
            message.client.log.error(e);
          });
        }
      }
    }
  }
  catch (e) {
    message.client.log.error(e);
  }
};
