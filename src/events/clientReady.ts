import { Client, ActivityType } from "discord.js";
import { client } from "../../index";

client.once('clientReady', () => {
    if (!client.user) return;

    const ping = client.ws.ping;
  
    client.user.setActivity(`⚡ simo.squareweb.app [${ping}ms]`, {
        type: ActivityType.Custom
    });
});
