import { Message, ChannelType } from "discord.js";
import { client } from "../../index";

const SUGGESTIONS_CHANNEL_ID = "1458586171121729751";

client.on('messageCreate', async (message: Message): Promise<void> => {
    if (message.author.bot) return;
    
    if (message.channelId !== SUGGESTIONS_CHANNEL_ID) return;
    
    if (message.channel.type !== ChannelType.GuildText) return;
    
    try {
        const thread = await message.startThread({
            name: `Sugestão de ${message.author.username}`,
            autoArchiveDuration: 1440,
            reason: 'Thread automática para discussão de sugestão'
        });
        
        await thread.send({
            content: `📝 Tópico aberto para discutir a sugestão de ${message.author}!\n\nUse este espaço para debater sobre a ideia apresentada.`,
            allowedMentions: { parse: [] }
        });
      
        await message.react('1458870534539317341');
        await message.react('1458870522258657393');
        
        console.log(`Thread criada para sugestão de ${message.author.tag}`);
    } catch (error) {
        console.error('Erro ao criar thread de sugestão:', error);
    }
});
