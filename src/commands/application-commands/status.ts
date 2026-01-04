import type { ApplicationCommandStructure, ApiStatusStructure } from "../../types";
import { EmbedBuilder } from "discord.js";

export default {
    name: "status",
    async run(client, interaction) {
      await interaction.deferReply();
        
      const fetchData = async (): Promise<ApiStatusStructure> => {
        const req = await fetch("https://simobotlist.online/api/status");
        const json: ApiStatusStructure = await req.json();
        return json;
      }
      const data: ApiStatusStructure = await fetchData();
      if (!data) interaction.editReply("❌ A API está temporariamente indisponivel. (off)");

      const embed = new EmbedBuilder()
        .setTitle("⚡ API Status")
        .setColor("#ffffff")
        .addFields(
          {
            name: "Memória RAM",
            value: `${Math.round(data.free_mem)}/${Math.round(data.total_mem)}`
          },
          {
            name: "Usuários Logados",
            value: `${data.users}`
          },
          {
            name: "Quantia de Bots",
            value: `${data.bots}`
          },
          {
            name: "Tempo de Atividade",
            value: "<t:" + Math.round(new Date(Date.now() - (data.uptime as number)).getTime() / 1000) + ":R>"
          },
          {
            name: "Requisições",
            value: `${data.request_count}`
          }
        );
      return interaction.editReply({ embeds: [embed] })
    }
} as ApplicationCommandStructure;
