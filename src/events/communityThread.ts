import { Message, ChannelType } from "discord.js";
import { client } from "../../index";

const COMMUNITY_CHANNEL_ID = "1458587511398858783";

client.on('messageCreate', async (message: Message): Promise<void> => {
    if (message.author.bot) return;
    
    if (message.channelId !== COMMUNITY_CHANNEL_ID) return;
    
    if (message.channel.type !== ChannelType.GuildText) return;
    
    try {
        const thread = await message.startThread({
            name: `Suporte Comunitário | ${message.author.username}`,
            autoArchiveDuration: 1440,
            reason: 'Thread automática para solicitação de suporte'
        });
        
        await thread.send({
            content: `> Tópico aberto para suprir a solicitação de suporte feita por ${message.author}.`,
            allowedMentions: { parse: [] }
        });
      
        console.log(`Thread criada para ajuda comunitária de ${message.author.tag}`);
    } catch (error) {
        console.error('Erro ao criar thread de ajuda comunitária:', error);
    }
});
