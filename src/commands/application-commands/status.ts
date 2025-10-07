import type { ApplicationCommandStructure, ApiStatusStructure } from "../../types";
import { EmbedBuilder } from "discord.js";

export default {
    name: "status",
    async run(client, interaction) {
      const fetchData = async (): Promise<ApiStatusStructure> => {
        const req = await fetch("https://simo.squareweb.app/api/status");
        const json: ApiStatusStructure = await req.json();
        return json;
      }
      const data: ApiStatusStructure = await fetchData();
      if (!data) interaction.reply("A api está offline.");
      
      const embed = new EmbedBuilder()
        .setTitle(":middle_finger: Api status")
        .setColor(0x000ff)
        .addFields(
          {
            name: "Memória ram",
            value: `${Math.round(data.free_mem)}/${Math.round(data.total_mem)}`
          },
          {
            name: "Usuários logados",
            value: `${data.users}`
          },
          {
            name: "Quantia de bots",
            value: `${data.bots}`
          },
          {
            name: "Uptime",
            value: "<t:" + Math.round(new Date(Date.now() - (data.uptime as number)).getTime() / 1000) + ":R>"
          },
          {
            name: "Requisições",
            value: `${data.request_count}`
          }
        );
      return interaction.reply({ embeds: [embed] })
    }
} as ApplicationCommandStructure;
