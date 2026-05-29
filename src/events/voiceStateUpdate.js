import { Events } from "discord.js";
import { logger } from "../utils/logger.js";

export default {
  name: "voiceStateUpdate",
  async execute(oldState, newState, client) {
    // Track call start/end times for /time command
    if (newState.member.user.bot) return;

    const timeCommand = client.commands.get("time");
    if (timeCommand) {
      const callStartTimes = timeCommand._callStartTimes;
      const channel = newState.channel || oldState.channel;
      if (channel) {
        const humanMembers = channel.members.filter((m) => !m.user.bot);
        if (humanMembers.size === 1 && !callStartTimes.has(channel.id)) {
          callStartTimes.set(channel.id, Date.now());
          logger.info(`Call started in ${channel.name}`);
        } else if (humanMembers.size === 0) {
          callStartTimes.delete(channel.id);
          logger.info(`Call ended in ${channel.name}`);
        }
      }
    }
  },
};
