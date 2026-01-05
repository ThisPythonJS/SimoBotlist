import type { ApplicationCommandStructure } from "../../types";
import { EmbedBuilder } from "discord.js";

interface ApiStatusStructureOld {
    total_mem: number;
    free_mem: number;
    users: number;
    bots: number;
    uptime: number;
    request_count: number;
}

interface ApiStatusStructureNew {
    status: string;
    timestamp: number;
    memory: {
        total_mb: number;
        free_mb: number;
        used_mb: number;
        usage_percent: number;
    };
    cpu: {
        cores: number;
        model: string;
        load_average: {
            "1min": number;
            "5min": number;
            "15min": number;
        };
    };
    system: {
        platform: string;
        arch: string;
        node_version: string;
    };
    database: {
        status: string;
        name: string;
    };
    statistics: {
        users: number;
        bots: number;
        request_count: number;
    };
    uptime: {
        milliseconds: number;
        formatted: string;
        started_at: number;
    };
}

type ApiStatusStructure = ApiStatusStructureOld | ApiStatusStructureNew;

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

        const isNewVersion = 'memory' in data;

        if (isNewVersion) {
            const newData = data as ApiStatusStructureNew;
            const statusEmoji = newData.status === "healthy" ? "🟢" : "🟡";
            const dbEmoji = newData.database.status === "connected" ? "🟢" : "🔴";
            
            const memoryBar = createProgressBar(newData.memory.usage_percent, 10);
            const cpuLoad1min = (newData.cpu.load_average["1min"] / newData.cpu.cores) * 100;
            const cpuBar = createProgressBar(cpuLoad1min, 10);

            const embed = new EmbedBuilder()
                .setTitle("Status da API")
                .setColor(newData.status === "healthy" ? 0x00FF00 : 0xFFFF00)
                .addFields(
                    {
                        name: `Status Geral ${statusEmoji}`,
                        value: `Sistema: \`${newData.system.platform} ${newData.system.arch}\`\nNode: \`${newData.system.node_version}\``,
                        inline: false
                    },
                    {
                        name: "Memória RAM",
                        value: `${memoryBar} ${newData.memory.usage_percent}%\n\`${newData.memory.used_mb}MB\` / \`${newData.memory.total_mb}MB\` (Livre: \`${newData.memory.free_mb}MB\`)`,
                        inline: false
                    },
                    {
                        name: "CPU",
                        value: `${cpuBar} ${Math.round(cpuLoad1min)}%\nCores: \`${newData.cpu.cores}\`\nLoad Average: \`${newData.cpu.load_average["1min"]}\` / \`${newData.cpu.load_average["5min"]}\` / \`${newData.cpu.load_average["15min"]}\`\n${newData.cpu.model}`,
                        inline: false
                    },
                    {
                        name: `Database ${dbEmoji}`,
                        value: `Status: \`${newData.database.status}\`\nDatabase: \`${newData.database.name}\``,
                        inline: false
                    },
                    {
                        name: "Estatísticas",
                        value: `Usuários: \`${newData.statistics.users}\`\nBots: \`${newData.statistics.bots}\`\nRequisições: \`${newData.statistics.request_count}\``,
                        inline: false
                    },
                    {
                        name: "Uptime",
                        value: `${newData.uptime.formatted}\nIniciado: <t:${Math.round(newData.uptime.started_at / 1000)}:R>`,
                        inline: false
                    }
                )
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        const oldData = data as ApiStatusStructureOld;
        const usedMemMB = Math.round(oldData.total_mem - oldData.free_mem);
        const memUsagePercent = ((usedMemMB / oldData.total_mem) * 100).toFixed(2);
        const memoryBar = createProgressBar(parseFloat(memUsagePercent), 10);

        const embed = new EmbedBuilder()
            .setTitle("Status da API")
            .setColor(0x00FF00)
            .addFields(
                {
                    name: "Memória RAM",
                    value: `${memoryBar} ${memUsagePercent}%\n\`${usedMemMB}MB\` / \`${Math.round(oldData.total_mem)}MB\` (Livre: \`${Math.round(oldData.free_mem)}MB\`)`,
                    inline: false
                },
                {
                    name: "Estatísticas",
                    value: `Usuários: \`${oldData.users}\`\nBots: \`${oldData.bots}\`\nRequisições: \`${oldData.request_count}\``,
                    inline: false
                },
                {
                    name: "Uptime",
                    value: `Iniciado: <t:${Math.round((Date.now() - oldData.uptime) / 1000)}:R>`,
                    inline: false
                }
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
} as ApplicationCommandStructure;

function createProgressBar(percentage: number, length: number = 10): string {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return `${'▰'.repeat(filled)}${'▱'.repeat(empty)}`;
}