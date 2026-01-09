import { CommandStructure } from "../../types";
import { OWNERS_ID } from '../../../.config.json';
import { userSchema } from "../../schemas/User";
import { botSchema } from "../../schemas/Bot";
import { Message, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const ITEMS_PER_PAGE = 10;
const activeEvals = new Map<string, { result: any; authorId: string; botMsg: Message }>();

export default {
    name: 'eval',
    aliases: ['ev', 'e'],
    async run(client, message, args) {
        if (!OWNERS_ID.includes(message.author.id)) return;
        if (!args[0]) return message.channel.send('<:crosscircle:1458870522258657393> Nenhum código foi fornecido');

        const silent = args[0] === '$silent';
        const code = (silent ? args.slice(1) : args).join(' ').slice(0, 1900);

        if (!code) return message.channel.send('<:crosscircle:1458870522258657393> Nenhum código foi fornecido');

        try {
            let evaluated: unknown = eval(code);

            if (evaluated instanceof Promise) evaluated = await evaluated;

            if (silent && evaluated === undefined) {
                return await message.react('<:checkcircle:1458870534539317341>').catch(() => {});
            }

            if (silent) {
                return await sendResult(message, evaluated, code);
            }

            await message.react('<:checkcircle:1458870534539317341>').catch(() => {});
            
            if (evaluated !== undefined) {
                await sendResult(message, evaluated, code);
            }
        } catch (unknownError: unknown) {
            const error: Error = unknownError as Error;

            if (!silent) {
                await message.react('<:crosscircle:1458870522258657393>').catch(() => {});
            }

            const errorMsg = await message.channel.send(`<:crosscircle:1458870522258657393> **${error.name}:** ${error.message}`);
            setupDeleteButtons(errorMsg, message);
        }
    }
} as CommandStructure;

async function sendResult(message: Message, result: any, code: string) {
    const formatted = formatResult(result);
    
    if (Array.isArray(formatted) && formatted.length > ITEMS_PER_PAGE) {
        return await sendPaginated(message, formatted, code);
    }

    const output = Array.isArray(formatted) 
        ? formatted.join('\n') 
        : formatted;

    const botMsg = await message.reply({
        content: `\`\`\`js\n${output}\`\`\``,
        components: [createDeleteRow()]
    });

    activeEvals.set(botMsg.id, { result, authorId: message.author.id, botMsg });
    setupCollector(botMsg, message);
}

async function sendPaginated(message: Message, items: string[], code: string) {
    let currentPage = 0;
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

    const getPage = (page: number) => {
        const start = page * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return items.slice(start, end).join('\n');
    };

    const botMsg = await message.reply({
        content: `\`\`\`js\n${getPage(currentPage)}\`\`\`\nPágina ${currentPage + 1}/${totalPages}`,
        components: [createPaginationRow(currentPage, totalPages), createDeleteRow()]
    });

    activeEvals.set(botMsg.id, { result: items, authorId: message.author.id, botMsg });

    const collector = botMsg.createMessageComponentCollector({ 
        time: 300000
    });

    collector.on('collect', async (interaction) => {
        if (interaction.user.id !== message.author.id) {
            return interaction.reply({ 
                content: 'Apenas quem executou o comando pode usar os botões!', 
                ephemeral: true 
            });
        }

        if (interaction.customId === 'eval_delete') {
            await message.delete().catch(() => {});
            await botMsg.delete().catch(() => {});
            activeEvals.delete(botMsg.id);
            return;
        }

        if (interaction.customId === 'eval_rerun') {
            await interaction.deferUpdate();
            collector.stop();
            activeEvals.delete(botMsg.id);
            
            try {
                let evaluated: unknown = eval(code);
                if (evaluated instanceof Promise) evaluated = await evaluated;
                
                await botMsg.delete().catch(() => {});
                await sendResult(message, evaluated, code);
            } catch (error: any) {
                await botMsg.edit({
                    content: `<:crosscircle:1458870522258657393> **${error.name}:** ${error.message}`,
                    components: [createDeleteRow()]
                });
            }
            return;
        }

        if (interaction.customId === 'prev') currentPage--;
        if (interaction.customId === 'next') currentPage++;

        await interaction.update({
            content: `\`\`\`js\n${getPage(currentPage)}\`\`\`\nPágina ${currentPage + 1}/${totalPages}`,
            components: [createPaginationRow(currentPage, totalPages), createDeleteRow()]
        });
    });

    collector.on('end', () => {
        botMsg.edit({ components: [] }).catch(() => {});
        activeEvals.delete(botMsg.id);
    });
}

function setupCollector(botMsg: Message, authorMsg: Message) {
    const collector = botMsg.createMessageComponentCollector({ 
        time: 300000 
    });

    collector.on('collect', async (interaction) => {
        if (interaction.user.id !== authorMsg.author.id) {
            return interaction.reply({ 
                content: 'Apenas quem executou o comando pode usar os botões!', 
                ephemeral: true 
            });
        }

        if (interaction.customId === 'eval_delete') {
            await authorMsg.delete().catch(() => {});
            await botMsg.delete().catch(() => {});
            activeEvals.delete(botMsg.id);
        }

        if (interaction.customId === 'eval_rerun') {
            await interaction.deferUpdate();
            collector.stop();
            
            const evalData = activeEvals.get(botMsg.id);
            if (!evalData) return;

            activeEvals.delete(botMsg.id);
            await botMsg.delete().catch(() => {});
            
            const fakeArgs = interaction.message.content
                .replace(/```js\n|```/g, '')
                .split('\n')[0]
                .split(' ');
            
            try {
                let evaluated: unknown = eval(evalData.result);
                if (evaluated instanceof Promise) evaluated = await evaluated;
                await sendResult(authorMsg, evaluated, fakeArgs.join(' '));
            } catch (error: any) {
                await authorMsg.reply({
                    content: `<:crosscircle:1458870522258657393> **${error.name}:** ${error.message}`,
                    components: [createDeleteRow()]
                });
            }
        }
    });

    collector.on('end', () => {
        botMsg.edit({ components: [] }).catch(() => {});
        activeEvals.delete(botMsg.id);
    });
}

function setupDeleteButtons(botMsg: Message, authorMsg: Message) {
    const collector = botMsg.createMessageComponentCollector({ time: 300000 });

    collector.on('collect', async (interaction) => {
        if (interaction.user.id !== authorMsg.author.id) {
            return interaction.reply({ 
                content: 'Apenas quem executou o comando pode usar os botões!', 
                ephemeral: true 
            });
        }

        if (interaction.customId === 'eval_delete') {
            await authorMsg.delete().catch(() => {});
            await botMsg.delete().catch(() => {});
        }
    });

    collector.on('end', () => {
        botMsg.edit({ components: [] }).catch(() => {});
    });
}

function createDeleteRow() {
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('eval_delete')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('eval_rerun')
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Primary)
        );
}

function createPaginationRow(currentPage: number, totalPages: number) {
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('prev')
                .setEmoji('⬅️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId('next')
                .setEmoji('➡️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === totalPages - 1)
        );
}

function formatResult(result: any): string | string[] {
    if (result === undefined) return 'undefined';
    if (result === null) return 'null';
    
    if (Array.isArray(result)) {
        return result.map((item, i) => `[${i}] ${formatSingleItem(item)}`);
    }

    if (typeof result === 'object') {
        try {
            return JSON.stringify(result, null, 2);
        } catch {
            return String(result);
        }
    }

    return String(result);
}

function formatSingleItem(item: any): string {
    if (typeof item === 'object' && item !== null) {
        try {
            return JSON.stringify(item);
        } catch {
            return String(item);
        }
    }
    return String(item);
}