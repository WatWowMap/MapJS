const { clearOtherSessions } = require('../session-store.js');

module.exports = async (client, oldPresence, newPresence) => {
    const roleBefore = oldPresence.roles.cache.find((role) => client.config.discord.perms.map.roles.includes(role.id));
    const roleAfter = newPresence.roles.cache.find((role) => client.config.discord.perms.map.roles.includes(role.id));
    try {
        if (roleBefore && !roleAfter) {
            await clearOtherSessions(oldPresence.user.id, '');
        }
    } catch (e) {
        console.error(`Could not clear sessions for ${oldPresence.user.username}#${oldPresence.user.discriminator}`);
    }
};
