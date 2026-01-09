import { Message, ThreadChannel, ChannelType, EmbedBuilder } from "discord.js";
import { client } from "../../index";
import { botSchema } from "../schemas/Bot";

const activeAnalysisThreads = new Map<string, string>();

client.on('messageCreate', async (message): Promise<any> => {
    if (message.author.bot) return;
    
    const ANALYSIS_CHANNEL_ID = "1458591167061954661";
    if (message.channelId !== ANALYSIS_CHANNEL_ID) return;

    const member = await message.guild?.members.fetch(message.author.id);
    const VERIFIER_ROLE_ID = "1458601523562151999";
    
    if (!member?.roles.cache.has(VERIFIER_ROLE_ID)) return;

    const botMentions = message.mentions.users.filter(user => user.bot);
    
    if (botMentions.size === 0) return;

    for (const [botId, botUser] of botMentions) {
        try {
            const botData = await botSchema.findById(botId);
            
            if (!botData) continue;
            if (botData.approved) continue;
            if (activeAnalysisThreads.has(botId)) {
                const existingThreadId = activeAnalysisThreads.get(botId);
                const existingThread = message.guild?.channels.cache.get(existingThreadId!) as ThreadChannel;

                if (existingThread && !existingThread.archived) {
                    await message.reply({
                        content: `<:errado:1457340965974049044> Já existe uma thread de análise ativa para **${botData.name}**: ${existingThread}`,
                        allowedMentions: { repliedUser: false }
                    });
                    continue;
                }
            }

            const thread = await message.startThread({
                name: `Análise: ${botData.name}`,
                autoArchiveDuration: 1440,
                reason: `Thread de análise para o bot ${botData.name}`
            });

            activeAnalysisThreads.set(botId, thread.id);

            const embed = new EmbedBuilder()
                .setTitle(`Análise: ${botData.name}`)
                .setColor(0x054f77)
                .setThumbnail(botData.avatar)
                .setDescription(`Thread criada para análise do bot **${botData.name}**.`)
                .addFields(
                    { name: "Desenvolvedor", value: `<@${botData.owner_id}>`, inline: true },
                    { name: "Analisador", value: `${message.author}`, inline: true },
                    { name: "Descrição Curta", value: botData.short_description },
                    { name: "Tags", value: botData.tags.join(", ") || "Nenhuma", inline: true },
                    { name: "Prefixos", value: botData.prefixes.join(", "), inline: true }
                )
                .addFields({
                    name: "Links",
                    value: [
                        `[Convite](${botData.invite_url})`,
                        botData.website_url ? `[Website](${botData.website_url})` : null,
                        botData.support_server ? `[Servidor de Suporte](${botData.support_server})` : null,
                        botData.source_code ? `[Código Fonte](${botData.source_code})` : null
                    ].filter(Boolean).join(" ")
                })
                .setFooter({ text: `ID do Bot: ${botId}` })
                .setTimestamp();

            await thread.send({
                content: `<@${botData.owner_id}> <@${message.author.id}>`,
                embeds: [embed],
                allowedMentions: { users: [botData.owner_id, message.author.id] }
            });

            await thread.send({
                content: `## **📌 Instruções:**\n` +
                    `- Esta thread foi criada para discussão sobre a análise do bot.\n` +
                    `- O desenvolvedor pode responder dúvidas e fornecer informações adicionais.\n` +
                    `- O analisador deve usar \`/queue\` para aprovar ou recusar o bot.\n` +
                    `- A thread será arquivada automaticamente após 24 horas de inatividade.`
            });

            const checkThreadStatus = setInterval(async () => {
                try {
                    const threadChannel = await message.guild?.channels.fetch(thread.id) as ThreadChannel;
                    
                    if (!threadChannel || threadChannel.archived) {
                        activeAnalysisThreads.delete(botId);
                        clearInterval(checkThreadStatus);
                    }
                } catch (error) {
                    activeAnalysisThreads.delete(botId);
                    clearInterval(checkThreadStatus);
                }
            }, 60000);

        } catch (error) {
            console.error(`Erro ao criar thread para o bot ${botId}:`, error);
            await message.reply({
                content: `<:errado:1457340965974049044> Ocorreu um erro ao criar a thread de análise para ${botUser}.`,
                allowedMentions: { repliedUser: false }
            });
        }
    }
});

client.on('threadUpdate', async (oldThread, newThread) => {
    if (newThread.archived) {
        for (const [botId, threadId] of activeAnalysisThreads.entries()) {
            if (threadId === newThread.id) {
                activeAnalysisThreads.delete(botId);
                break;
            }
        }
    }
});

client.on('threadDelete', async (thread) => {
    for (const [botId, threadId] of activeAnalysisThreads.entries()) {
        if (threadId === thread.id) {
            activeAnalysisThreads.delete(botId);
            break;
        }
    }
});

export async function clearAnalysisThread(botId: string) {
    const threadId = activeAnalysisThreads.get(botId);
    if (threadId) {
        activeAnalysisThreads.delete(botId);
        
        try {
            const thread = await client.channels.fetch(threadId) as ThreadChannel;
            if (thread && !thread.archived) {
                await thread.setArchived(true, "Bot aprovado/recusado. Encerrando análise");
            }
        } catch (error) {
            console.error(`Erro ao arquivar thread ${threadId}:`, error);
        }
    }
}