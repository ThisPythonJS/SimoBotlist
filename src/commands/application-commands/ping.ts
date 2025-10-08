import type { ApplicationCommandStructure } from "../../types";

export default {
    name: 'ping',
    async run(client, interaction) {
        await interaction.deferReply();
        
        const targetShard: number = interaction.options.getInteger('shard') ?? 0;
        const shard = client.ws.shards.get(targetShard);

        if (!shard) return interaction.reply({
            content: `🫣 Shard ${targetShard} não foi encontrado`,
            flags: "Ephemeral"
        });

        return interaction.editReply({
            content: `🏓 Ping: **${shard.ping}ms**`
        });
    }
} as ApplicationCommandStructure;
