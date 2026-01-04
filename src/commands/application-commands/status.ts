import type { ApplicationCommandStructure } from "../../types";
import { 
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} from "discord.js";

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

            const container = new ContainerBuilder()
                .setAccentColor(newData.status === "healthy" ? 0x00FF00 : 0xFFFF00);

            const headerText = new TextDisplayBuilder()
                .setContent(`## ⚡ Status da API Simo`);
            
            const headerSection = new SectionBuilder()
                .addTextDisplayComponents(headerText);

            container.addSectionComponents(headerSection);
            container.addSeparatorComponents(new SeparatorBuilder());

            const statusText = new TextDisplayBuilder()
                .setContent(
                    `**Status Geral** ${statusEmoji}\n` +
                    `-# Sistema: \`${newData.system.platform} ${newData.system.arch}\`\n` +
                    `-# Node: \`${newData.system.node_version}\``
                );

            container.addTextDisplayComponents(statusText);
            container.addSeparatorComponents(new SeparatorBuilder());

            const memoryText = new TextDisplayBuilder()
                .setContent(
                    `**💾 Memória RAM**\n` +
                    `${memoryBar} ${newData.memory.usage_percent}%\n` +
                    `\`${newData.memory.used_mb}MB\` / \`${newData.memory.total_mb}MB\` (Livre: \`${newData.memory.free_mb}MB\`)`
                );

            container.addTextDisplayComponents(memoryText);
            container.addSeparatorComponents(new SeparatorBuilder());

            const cpuText = new TextDisplayBuilder()
                .setContent(
                    `**🖥️ CPU**\n` +
                    `${cpuBar} ${Math.round(cpuLoad1min)}%\n` +
                    `Cores: \`${newData.cpu.cores}\`\n` +
                    `Load Average: \`${newData.cpu.load_average["1min"]}\` / \`${newData.cpu.load_average["5min"]}\` / \`${newData.cpu.load_average["15min"]}\`\n` +
                    `-# ${newData.cpu.model}`
                );

            container.addTextDisplayComponents(cpuText);
            container.addSeparatorComponents(new SeparatorBuilder());

            const dbText = new TextDisplayBuilder()
                .setContent(
                    `**🗄️ Database** ${dbEmoji}\n` +
                    `Status: \`${newData.database.status}\`\n` +
                    `Database: \`${newData.database.name}\``
                );

            container.addTextDisplayComponents(dbText);
            container.addSeparatorComponents(new SeparatorBuilder());

            const statsText = new TextDisplayBuilder()
                .setContent(
                    `**📊 Estatísticas**\n` +
                    `Usuários: \`${newData.statistics.users}\`\n` +
                    `Bots: \`${newData.statistics.bots}\`\n` +
                    `Requisições: \`${newData.statistics.request_count}\``
                );

            container.addTextDisplayComponents(statsText);
            container.addSeparatorComponents(new SeparatorBuilder());

            const uptimeText = new TextDisplayBuilder()
                .setContent(
                    `**⏱️ Uptime**\n` +
                    `${newData.uptime.formatted}\n` +
                    `Iniciado: <t:${Math.round(newData.uptime.started_at / 1000)}:R>`
                );

            container.addTextDisplayComponents(uptimeText);

            return interaction.editReply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const oldData = data as ApiStatusStructureOld;
        const usedMemMB = Math.round(oldData.total_mem - oldData.free_mem);
        const memUsagePercent = ((usedMemMB / oldData.total_mem) * 100).toFixed(2);
        const memoryBar = createProgressBar(parseFloat(memUsagePercent), 10);

        const container = new ContainerBuilder()
            .setAccentColor(0x00FF00);

        const headerText = new TextDisplayBuilder()
            .setContent(`## ⚡ Status da API Simo`);
        
        const headerSection = new SectionBuilder()
            .addTextDisplayComponents(headerText);

        container.addSectionComponents(headerSection);
        container.addSeparatorComponents(new SeparatorBuilder());

        const memoryText = new TextDisplayBuilder()
            .setContent(
                `**💾 Memória RAM**\n` +
                `${memoryBar} ${memUsagePercent}%\n` +
                `\`${usedMemMB}MB\` / \`${Math.round(oldData.total_mem)}MB\` (Livre: \`${Math.round(oldData.free_mem)}MB\`)`
            );

        container.addTextDisplayComponents(memoryText);
        container.addSeparatorComponents(new SeparatorBuilder());

        const statsText = new TextDisplayBuilder()
            .setContent(
                `**📊 Estatísticas**\n` +
                `Usuários: \`${oldData.users}\`\n` +
                `Bots: \`${oldData.bots}\`\n` +
                `Requisições: \`${oldData.request_count}\``
            );

        container.addTextDisplayComponents(statsText);
        container.addSeparatorComponents(new SeparatorBuilder());

        const uptimeText = new TextDisplayBuilder()
            .setContent(
                `**⏱️ Uptime**\n` +
                `Iniciado: <t:${Math.round((Date.now() - oldData.uptime) / 1000)}:R>`
            );

        container.addTextDisplayComponents(uptimeText);

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