import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { createEmbed, errorEmbed } from "../../utils/embeds.js";
import { logger } from "../../utils/logger.js";
import { handleInteractionError } from "../../utils/errorHandler.js";
import { InteractionHelper } from "../../utils/interactionHelper.js";

const callStartTimes = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName("time")
    .setDescription("See how long the current voice call has been going")
    .setDMPermission(false),

  category: "Voice",

  async execute(interaction, config, client) {
    try {
      const deferred = await InteractionHelper.safeDefer(interaction, {
        flags: MessageFlags.Ephemeral,
      });
      if (!deferred) return;

      const voiceChannel = interaction.guild.channels.cache.find(
        (c) => c.members && c.members.size > 0 && c.type === 2,
      );

      if (
        !voiceChannel ||
        voiceChannel.members.filter((m) => !m.user.bot).size === 0
      ) {
        return await InteractionHelper.safeEditReply(interaction, {
          embeds: [
            errorEmbed(
              "No Active Call",
              "There is no active voice call right now.",
            ),
          ],
        });
      }

      let callStart = callStartTimes.get(voiceChannel.id);

      if (!callStart) {
        callStart = Date.now();
        callStartTimes.set(voiceChannel.id, callStart);
      }

      const elapsed = Date.now() - callStart;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);

      const formatted = [
        hours > 0 ? `${hours}h` : null,
        minutes > 0 ? `${minutes}m` : null,
        `${seconds}s`,
      ]
        .filter(Boolean)
        .join(" ");

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [
          createEmbed({
            title: "📞 Call Duration",
            description: `The call in **${voiceChannel.name}** has been going for **${formatted}**`,
            color: "info",
          }),
        ],
      });
    } catch (error) {
      logger.error("Error in time command", {
        error: error.message,
        stack: error.stack,
        userId: interaction.user.id,
        guildId: interaction.guildId,
        commandName: "time",
      });
      await handleInteractionError(interaction, error, { commandName: "time" });
    }
  },

  _callStartTimes: callStartTimes,
};
