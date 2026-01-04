import type { ApiStatusStructure, ApplicationCommandStructure } from "../../types";
import { 
    ContainerBuilder,
    MessageFlags,
} from "discord.js";

export default {
    name: "status",
    async run(client, interaction) {
        await interaction.deferReply();
        
        const fetchData = async (): Promise<ApiStatusStructure | null> => {
            try {
                const req = await fetch("https://simo-api.camposcloud.app/api/status");
                if (!req.ok) return null;
                const json: ApiStatusStructure = await req.json();
                return json;
            } catch {
                return null;
            }
        };

        const data = await fetchData();
        
        if (!data) {
            return interaction.editReply({
                content: "❌ A API está temporariamente indisponível (offline)."
            });
        }

        const statusEmoji = data.status === "healthy" ? "🟢" : "🟡";
        const dbEmoji = data.database.status === "connected" ? "🟢" : "🔴";
        
        const memoryBar = createProgressBar(data.memory.usage_percent, 10);
        const cpuLoad1min = (data.cpu.load_average["1min"] / data.cpu.cores) * 100;
        const cpuBar = createProgressBar(cpuLoad1min, 10);

        const container = new ContainerBuilder()
            .setAccentColor(data.status === "healthy" ? 0x00FF00 : 0xFFFF00);

        container.addSectionComponents((section) =>
            section.addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent(`## ⚡ Status da API Simo`)
            )
        );

        container.addSeparatorComponents((separator) => separator);

        container.addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
                `**Status Geral** ${statusEmoji}\n` +
                `-# Sistema: \`${data.system.platform} ${data.system.arch}\`\n` +
                `-# Node: \`${data.system.node_version}\``
            )
        );

        container.addSeparatorComponents((separator) => separator);

        container.addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
                `**💾 Memória RAM**\n` +
                `${memoryBar} ${data.memory.usage_percent}%\n` +
                `\`${data.memory.used_mb}MB\` / \`${data.memory.total_mb}MB\` (Livre: \`${data.memory.free_mb}MB\`)`
            )
        );

        container.addSeparatorComponents((separator) => separator);

        container.addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
                `**🖥️ CPU**\n` +
                `${cpuBar} ${Math.round(cpuLoad1min)}%\n` +
                `Cores: \`${data.cpu.cores}\`\n` +
                `Load Average: \`${data.cpu.load_average["1min"]}\` / \`${data.cpu.load_average["5min"]}\` / \`${data.cpu.load_average["15min"]}\`\n` +
                `-# ${data.cpu.model}`
            )
        );

        container.addSeparatorComponents((separator) => separator);

        container.addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
                `**🗄️ Database** ${dbEmoji}\n` +
                `Status: \`${data.database.status}\`\n` +
                `Database: \`${data.database.name}\``
            )
        );

        container.addSeparatorComponents((separator) => separator);

        container.addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
                `**📊 Estatísticas**\n` +
                `Usuários: \`${data.statistics.users}\`\n` +
                `Bots: \`${data.statistics.bots}\`\n` +
                `Requisições: \`${data.statistics.request_count}\``
            )
        );

        container.addSeparatorComponents((separator) => separator);

        container.addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
                `**⏱️ Uptime**\n` +
                `${data.uptime.formatted}\n` +
                `Iniciado: <t:${Math.round(data.uptime.started_at / 1000)}:R>`
            )
        );

        return interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
} as ApplicationCommandStructure;

function createProgressBar(percentage: number, length: number = 10): string {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}