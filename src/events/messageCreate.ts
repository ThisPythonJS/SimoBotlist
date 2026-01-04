import { Message } from "discord.js";
import { client } from "../../index";
import { CommandStructure } from "../types";

client.on('messageCreate', async (message): Promise<any> => {
    if (message.author.bot) return;
    if (/^<@1424966376413466655>$/.test(message.content)) return message.channel.send('Oi sou o **Simo Botlist**, aplicação oficial da SImo Botlist. Meu prefixo é `s!`');

    const prefix: string = 's!';

    if (!message.content.startsWith(prefix)) return;

    const args: string[] = message.content.slice(prefix.length).trim().split(' ');
    const commandName: string = args.shift()!.toLowerCase();
    const command: CommandStructure | undefined = client.commands.find((command: CommandStructure): boolean | undefined => command.name === commandName || (command.aliases && command.aliases.includes(commandName)));

    if (command) {
        await command.run(client, message as Message<true>, args).catch(console.error);
    };
});
