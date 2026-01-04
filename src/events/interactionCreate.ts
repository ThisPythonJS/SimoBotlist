import { client } from "../../index";
import type { ApplicationCommandStructure } from "../types";
import { ChatInputCommandInteraction, Interaction, CacheType } from "discord.js";

client.on('interactionCreate', async (interaction: Interaction<CacheType>): Promise<void> => {
    if (!interaction.isCommand()) return;

    const command: ApplicationCommandStructure | undefined = client.applicationCommands.get(interaction.commandName);

    if (!command || !command.run) return;

    await command.run(client, interaction as ChatInputCommandInteraction).catch(console.error);
});