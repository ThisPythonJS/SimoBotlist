import type { ApplicationCommandStructure } from "../../types";
import { userSchema } from "../../schemas/User";
import { botSchema } from "../../schemas/Bot";
import { EmbedBuilder } from "discord.js";

export default {
	name: "user-info",
	async run(client, interaction) {
		await interaction.deferReply();
		
		const user = interaction.options.getUser("user") || interaction.user;
		const userDb = await userSchema.findById(user.id);

		if (!userDb) return interaction.reply("❌ Usuário não encontrado no banco de dados.\n🔹 Registre-se aqui: https://simo-botlist.vercel.app/login");

		const userBots = await botSchema.find({
			owner_id: user.id
		});

		const embed = new EmbedBuilder()
			.setColor("#FFFFFF")
			.setDescription(`## 👤 Informações do Usuário`)
			.setThumbnail(user.displayAvatarURL())
			.setImage(userDb.banner ?? null)
			.addFields({
				name: "Usuário",
				value: `**${userDb.username}**\n-# ╰ \`${userDb._id}\``,
			}, {
				name: "Biografia",
				value: userDb?.bio ? userDb.bio : "Nenhuma biografia definida",
			}, {
				name: "Aplicações",
				value: userBots.length ? userBots.map((bot) => `[${bot.name}](https://simo-botlist.vercel.app/bot/${bot._id})`).join(", ") : "Nenhum bot adicionado",
			});

		console.log("banner_url" in userDb);

		if (userDb?.banner_url) {
			embed.setImage(userDb.banner_url);
		}

		return interaction.editReply({
			embeds: [embed]
		});
	}
} as ApplicationCommandStructure;
