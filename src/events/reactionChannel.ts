import { Message, ChannelType } from "discord.js";
import { client } from "../../index";

const REACTION_CHANNEL_IDS = ["1458587600511303804", "1458587698737709259"];

client.on('messageCreate', async (message: Message): Promise<void> => {
    if (message.author.bot) return;
    
    if (!message.channelId.includes(`${REACTION_CHANNEL_IDS}`)) return;
    
    if (message.channel.type !== ChannelType.GuildText) return;
      
        await message.react('1458870534539317341');
        await message.react('1458870522258657393');
        
        console.log(`Reação criada na mensagem do ${message.author.tag} (messageID: ${message.id})`);
})
