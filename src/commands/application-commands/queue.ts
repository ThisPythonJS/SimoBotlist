import type { ApplicationCommandStructure, BotStructure } from "../../types";
import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { botSchema } from "../../schemas/Bot";
import { userSchema } from "../../schemas/User";
import { clearAnalysisThread } from "../../events/botAnalysisThread";

export default {
	name: "queue",
	async run(client, interaction) {
		const members = await interaction.guild?.members.fetch();

		if (!members?.find((member) => member.id === interaction.user.id)?.roles.cache.has("1458601523562151999")) 
			return interaction.reply("<:crosscircle:1458870522258657393> Você precisa ser um verificador para usar o comando.");

		let botsall: Array<{ label: string; value: string; description: string }> = [];

		const bots = await botSchema.find({ approved: false });

		if (bots.length === 0) 
			return interaction.reply({ content: "<:crosscircle:1458870522258657393> Não há bots para serem verificados." });

		const embed: EmbedBuilder = new EmbedBuilder()
			.setTitle("Queue")
			.setColor(0x054f77)
			.setDescription(bots.map((a, index) => `**[${index + 1}]** [${a.name}](https://discord.com/api/oauth2/authorize?client_id=${a._id}&scope=bot%20applications.commands)`).join("\n"))

		bots.map((bot) => {
			botsall.push({
				label: bot.name,
				description: bot.short_description.slice(0, 50) + "...",
				value: bot._id
			})
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
				.setColor(0x054f77)
				.setDescription(`Você deseja aprovar o bot **${selbot?.name}**, ou recusar? Escolha uma das alternativas abaixo.`);

			const actionRow = new ActionRowBuilder<ButtonBuilder>()
				.addComponents(
					new ButtonBuilder()
						.setCustomId("aprovado")
						.setLabel("Aprovar")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("<:checkcircle:1458870534539317341>"),
					new ButtonBuilder()
						.setCustomId("recusado")
						.setLabel("Recusar")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("<:crosscircle:1458870522258657393>")
				);

			const int = await interaction.update({ embeds: [embed], components: [actionRow] });

			const colector = int.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 30000 });

			colector.on("collect", async (interaction) => {
				if (!interaction.isButton()) return;

				if (interaction.customId === "aprovado") {
					const modal = new ModalBuilder()
						.setCustomId(`modal_aprovado_${selbot?._id}`)
						.setTitle("Comentários da Aprovação");

					const commentInput = new TextInputBuilder()
						.setCustomId("comentarios")
						.setLabel("Comentários sobre a análise")
						.setStyle(TextInputStyle.Paragraph)
						.setPlaceholder("Digite seus comentários aqui...")
						.setRequired(false)
						.setMaxLength(1024);

					const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(commentInput);

					modal.addComponents(firstActionRow);

					await interaction.showModal(modal);

					const modalInteraction = await interaction.awaitModalSubmit({ 
						filter: (i) => i.customId === `modal_aprovado_${selbot?._id}`, 
						time: 120000 
					}).catch(() => null);

					if (!modalInteraction) return;

					await modalInteraction.deferReply({ ephemeral: true });

					const comentarios = modalInteraction.fields.getTextInputValue("comentarios") || "Nenhum comentário fornecido.";

					await botSchema.findById(selbot?._id).updateOne({
						approved: true
					});

					const selbotMember = interaction.guild?.members.cache.get(selbot?._id as string);

					if (selbotMember) {
						await selbotMember.roles.add("1458604131257290905");
					}

					const ownerMember = interaction.guild?.members.cache.get(selbot?.owner_id as string);

					if (ownerMember) {
						await ownerMember.roles.add("1458601743251279955");
					}

					await fetch(process.env.WEBHOOK as string, {
						headers: {
							"Content-Type": 'application/json'
						},
						method: "POST",
						body: JSON.stringify({
							content: `<@${selbot?.owner_id}>`,
							embeds: [
								{
									title: `<:checkcircle:1458870534539317341> ${selbot?.name} foi aprovado na análise`,
									description: `> **Comentários do analisador:**\n${comentarios}`,
									color: 0x054f77
								}
							]
						})
					});

					if (selbot?._id) {
						await clearAnalysisThread(selbot._id);
					}

					await modalInteraction.editReply({ 
						content: `<:checkcircle:1458870534539317341> O bot **${selbot?.name}** foi aprovado com sucesso!`
					});

					await interaction.message.edit({ 
						content: `<:checkcircle:1458870534539317341> O bot **${selbot?.name}** foi aprovado com sucesso!`,
						embeds: [], 
						components: [] 
					});

				} else {
					const modal = new ModalBuilder()
						.setCustomId(`modal_recusado_${selbot?._id}`)
						.setTitle("Motivo da Recusa");

					const reasonInput = new TextInputBuilder()
						.setCustomId("motivo")
						.setLabel("Motivo da recusa")
						.setStyle(TextInputStyle.Paragraph)
						.setPlaceholder("Digite o motivo da recusa...")
						.setRequired(true)
						.setMaxLength(1024);

					const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);

					modal.addComponents(firstActionRow);

					await interaction.showModal(modal);

					const modalInteraction = await interaction.awaitModalSubmit({ 
						filter: (i) => i.customId === `modal_recusado_${selbot?._id}`, 
						time: 120000 
					}).catch(() => null);

					if (!modalInteraction) return;

					await modalInteraction.deferReply({ ephemeral: true });

					const motivo = modalInteraction.fields.getTextInputValue("motivo");

					await botSchema.findByIdAndDelete(selbot?._id);

					await fetch(process.env.WEBHOOK as string, {
						headers: {
							"Content-Type": 'application/json'
						},
						method: "POST",
						body: JSON.stringify({
							content: `<@${selbot?.owner_id}>`,
							embeds: [
								{
									title: `<:crosscircle:1458870522258657393> ${selbot?.name} foi recusado na análise`,
									description: `**Motivo:**\n${motivo}`,
									color: 0xFF0000
								}
							]
						})
					});

					const user = await userSchema.findById(selbot?.owner_id);

					if (user) {
						const notificationsId = [...user.notifications.keys()];

						user.notifications.set(
							notificationsId.length < 1
								? "1"
								: `${Math.max(...notificationsId.map(Number)) + 1}`,
							{
								content: `Seu bot **${selbot?.name}** foi recusado.\n**Motivo:** ${motivo}`,
								type: 2,
								sent_at: new Date().toISOString(),
							}
						);

						await user.save();
					}

					if (selbot?._id) {
						await clearAnalysisThread(selbot._id);
					}

					await modalInteraction.editReply({ 
						content: `<:crosscircle:1458870522258657393> O bot **${selbot?.name}** foi recusado com sucesso!`
					});

					await interaction.message.edit({ 
						content: `<:crosscircle:1458870522258657393> O bot **${selbot?.name}** foi recusado com sucesso!`,
						embeds: [], 
						components: [] 
					});
				}
			});
		});
	},
} as ApplicationCommandStructure;