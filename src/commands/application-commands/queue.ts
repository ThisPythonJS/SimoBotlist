import type { ApplicationCommandStructure, BotStructure } from "../../types";
import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, ButtonBuilder, ButtonStyle } from "discord.js";
import { botSchema } from "../../schemas/Bot";
import { userSchema } from "../../schemas/User";

export default {
	name: "queue",
	async run(client, interaction) {
		const members = await interaction.guild?.members.fetch();

		if (!members?.find((member) => member.id === interaction.user.id)?.roles.cache.has("991400149307887696")) return interaction.reply("Você precisa ser um verificador para usar o comando.");

		let botsall: Array<{ label: string; value: string; description: string }> = [];

		const bots = await botSchema.find({ approved: false });

		if (bots.length === 0) return interaction.reply({ content: "Não há bots para serem verificados." });

		const embed: EmbedBuilder = new EmbedBuilder()
			.setTitle("Queue")
			.setColor(0x00ff00)
			.setDescription(bots.map((a, index) => `**[${index + 1}]** [${a.name}](https://discord.com/api/oauth2/authorize?client_id=${a._id}&scope=bot%20applications.commands)`).join("\n"))

		bots.map((bot) => {
			botsall.push(
				{
					label: bot.name,
					description: bot.short_description.slice(0, 50) + "...",
					value: bot._id
				}
			)
		});

		const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
			.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId("selecaobot")
					.setPlaceholder("Selecione um bot")
					.setMinValues(1)
					.setMaxValues(1)
					.addOptions(botsall)
			);

		const int = await interaction.reply({
			embeds: [embed],
			components: [actionRow],
		});

		const colector = int.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, time: 30000 });

		colector.on("collect", async (interaction: StringSelectMenuInteraction) => {
			if (!interaction.isStringSelectMenu()) return;
			if (interaction.customId !== "selecaobot") return;

			const selbot: BotStructure | undefined = bots.find((bot) => bot._id === interaction.values[0]);

			const embed: EmbedBuilder = new EmbedBuilder()
				.setTitle("Ações - " + selbot?.name)
				.setColor(0x00ff00)
				.setDescription(`Você deseja aprovar o bot **${selbot?.name}**, ou recusar? Escolha uma das alternativas abaixo.`);

			const actionRow = new ActionRowBuilder<ButtonBuilder>()
				.addComponents(
					new ButtonBuilder()
						.setCustomId("aprovado")
						.setLabel("Aprovar")
						.setStyle(ButtonStyle.Success)
						.setEmoji("✅"),
					new ButtonBuilder()
						.setCustomId("recusado")
						.setLabel("Recusar")
						.setStyle(ButtonStyle.Danger)
						.setEmoji("✖️")
				);

			const int = await interaction.update({ embeds: [embed], components: [actionRow] });

			const colector = int.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 30000 });

			colector.on("collect", async (interaction) => {
				if (!interaction.isButton()) return;

				if (interaction.customId === "aprovado") {
					await botSchema.findById(selbot?._id).updateOne({
						approved: true
					})

					const selbotMember = interaction.guild?.members.cache.get(selbot?._id as string);

					if (selbotMember) {
						selbotMember.roles.add("1167271802934923274");
					}

					const ownerMember = interaction.guild?.members.cache.get(selbot?.owner_id as string);

					if (ownerMember) {
						ownerMember.roles.add("991507628553412759");
					}


					await fetch(process.env.WEBHOOK as string, {
						headers: {
							"Content-Type": 'application/json'
						},
						method: "POST",
						body: JSON.stringify({
							content: `<@${selbot?.owner_id}> :white_check_mark: Seu bot: **${selbot?.name}** (\`${selbot?._id}\`) foi aprovado!`,
						})
					});

					return void interaction.update({ content: `O bot **${selbot?.name}** foi aprovado com sucesso!`, embeds: [], components: [] })
				} else {
					await botSchema.findByIdAndDelete(selbot?._id);

					await fetch(process.env.WEBHOOK as string, {
						headers: {
							"Content-Type": 'application/json'
						},
						method: "POST",
						body: JSON.stringify({
							content: `<@${selbot?.owner_id}>\n :x: Seu bot: **${selbot?.name}** (\`${selbot?._id}\`) foi recusado.`,
						})
					});
					const user = await userSchema.findById(selbot?.owner_id);

					if (!user) return void interaction.update("Esse dono não está registrado na db");

					const notificationsId = [...user.notifications.keys()];

					user.notifications.set(
						notificationsId.length < 1
							? "1"
							: `${Math.max(...notificationsId.map(Number)) + 1}`,
						{
							content: `Seu bot **${selbot?.name}** foi recusado.`,
							type: 2,
							sent_at: new Date().toISOString(),
						}

					);

					await user.save();
					return void interaction.update({ content: `Bot **${selbot?.name}** foi recusado com sucesso!`, embeds: [], components: [] })
				}
			});
		});
	},
} as ApplicationCommandStructure;
