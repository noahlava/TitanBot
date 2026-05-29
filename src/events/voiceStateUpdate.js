import { Events } from "discord.js";
import { logger } from "../utils/logger.js";
import { stopwatchChannelId } from "./ready.js";

let stopwatchInterval = null;

function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

async function updateChannelName(client, startTime) {
  try {
    if (!stopwatchChannelId) return;
    const channel = await client.channels.fetch(stopwatchChannelId);
    if (!channel) return;
    const elapsed = Date.now() - startTime;
    await channel.setName(`📞 Call: ${formatDuration(elapsed)}`);
  } catch (error) {
    logger.error("Error updating stopwatch channel name:", error);
  }
}

async function startStopwatch(client, startTime) {
  await updateChannelName(client, startTime);
  stopwatchInterval = setInterval(() => {
    updateChannelName(client, startTime);
  }, 60000);
}

async function stopStopwatch(client) {
  if (stopwatchInterval) {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
  }
  try {
    if (!stopwatchChannelId) return;
    const channel = await client.channels.fetch(stopwatchChannelId);
    if (channel) await channel.setName("📞 Call: No Active Call");
  } catch (error) {
    logger.error("Error resetting stopwatch channel name:", error);
  }
}

export default {
  name: "voiceStateUpdate",
  async execute(oldState, newState, client) {
    if (newState.member.user.bot) return;

    const timeCommand = client.commands.get("time");
    const callStartTimes = timeCommand?._callStartTimes;

    const channel = newState.channel || oldState.channel;
    if (!channel) return;

    const humanMembers = channel.members.filter((m) => !m.user.bot);

    if (humanMembers.size === 1 && !callStartTimes?.has(channel.id)) {
      const startTime = Date.now();
      callStartTimes?.set(channel.id, startTime);
      logger.info(`Call started in ${channel.name}`);
      await startStopwatch(client, startTime);
    } else if (humanMembers.size === 0) {
      callStartTimes?.delete(channel.id);
      logger.info(`Call ended in ${channel.name}`);
      await stopStopwatch(client);
    }
  },
};
