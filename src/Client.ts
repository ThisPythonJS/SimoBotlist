import { Client, ClientOptions, Collection } from "discord.js";
import type { CommandStructure, ApplicationCommandStructure } from "./types";

export class ExtendedClient extends Client {
    public readonly commands: Collection<string, CommandStructure> = new Collection<string, CommandStructure>();
    public readonly applicationCommands: Collection<string, ApplicationCommandStructure> = new Collection<string, ApplicationCommandStructure>();

    constructor(options: ClientOptions) {
        super(options);
    };
};