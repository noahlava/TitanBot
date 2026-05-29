import { Events, ChannelType, PermissionFlagsBits } from "discord.js";
import { logger } from "../utils/logger.js";

const CATEGORY_ID = "1509388566537568407";
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_NAME_IDLE = "📞 Call: No Active Call";

export let stopwatchChannelId = null;

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    try {
      const guild = await client.guilds.fetch(GUILD_ID);

      // Check if channel already exists in the category
      const existing = guild.channels.cache.find(
        (c) => c.parentId === CATEGORY_ID && c.name.startsWith("📞"),
      );

      if (existing) {
        stopwatchChannelId = existing.id;
        logger.info(`Stopwatch channel already exists: ${existing.name}`);
        return;
      }

      const channel = await guild.channels.create({
        name: CHANNEL_NAME_IDLE,
        type: ChannelType.GuildVoice,
        parent: CATEGORY_ID,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionFlagsBits.Connect],
            allow: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });

      stopwatchChannelId = channel.id;
      logger.info(`Created stopwatch channel: ${channel.name}`);
    } catch (error) {
      logger.error("Error creating stopwatch channel:", error);
    }
  },
};
