import { sync } from "glob";
import { connect } from 'mongoose';
import { ExtendedClient } from './src/Client';
import { JSONStructure } from './src/commands/raw-app-commands';
import { ApplicationCommandStructure, CommandStructure } from './src/types';
import env from "dotenv";
import express, { Response, Request } from "express";

env.config();

const { CLIENT_TOKEN, MONGOOSE_URL } = process.env

export const client: ExtendedClient = new ExtendedClient({ intents: [34311] });

sync('./src/commands/prefixed/*.ts').forEach(async (path: string): Promise<void> => {
    const { default: command }: { default: CommandStructure; } = await import(`./${path}`);

    client.commands.set(command.name, command);
});

sync('./src/commands/application-commands/**/*.ts', { ignore: './src/commands/**/raw-app-commands.ts' }).forEach((f: string): void => {
    const { default: command }: { default: ApplicationCommandStructure; } = require(`./${f}`);

    client.applicationCommands.set(command.name, command);
});

client.on('ready', async (): Promise<void> => {
    await client.application?.commands.set(JSONStructure);
    await connect(MONGOOSE_URL as string);

    console.log(`Ligado como ${client.user!.username}`);
});

sync('./src/events/*.ts').forEach((e: string): void => {
    const event = require(`./${e}`);

    event.default;
});

process.on('unhandRejection', console.error);
process.on('uncaughtException', console.error);

const app = express();

app.get("/", (request: Request, response: Response) => {
  const ping = new Date();
  ping.setHours(ping.getHours() - 3);
  console.log(`Ping recebido às ${ping.getUTCHours()}:${ping.getUTCMinutes()}:${ping.getUTCSeconds()}`);
  response.sendStatus(200);
});

app.listen(process.env.PORT);

(async () => {
    await connect(process.env.MONGOOSE_URL as string).catch(console.error);
})();

client.login(CLIENT_TOKEN).catch(console.error);