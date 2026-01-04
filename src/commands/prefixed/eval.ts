import { CommandStructure } from "../../types";
import { OWNERS_ID } from '../../../.config.json';

export default {
    name: 'eval',
    aliases: ['ev', 'e'],
    async run(client, message, args) {
        if (!OWNERS_ID.includes(message.author.id)) return;
        if (!args[0]) return message.channel.send('<:errado:1457340965974049044> Nenhum código foi fornecido');

        try {
            const evaluated: unknown = eval(args.join(' ').slice(0, 1900));

            if (evaluated instanceof Promise) await evaluated;

            message.channel.send(`<:correto:1457340980452786320> Resultado: ${evaluated}`);
        } catch (unknownError: unknown) {
            const error: Error = unknownError as Error;

            message.channel.send(`<:errado:1457340965974049044> ${error.name}: ${error.message}`);
        };
    }
} as CommandStructure;