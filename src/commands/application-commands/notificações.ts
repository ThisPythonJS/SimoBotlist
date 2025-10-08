import type { ApplicationCommandStructure } from "../../types";
import { userSchema } from "../../schemas/User";
import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } from "discord.js";

export default {
	name: "notificações",
	async run(client, interaction) {
		await interaction.deferReply({ flags: "Ephemeral" });
		
		const userDb = await userSchema.findById(interaction.user.id);

		if (!userDb) {
			return interaction.editReply("❌ Usuário não encontrado no banco de dados.\n🔹 Registre-se aqui: https://simo-botlist.vercel.app/login");
		}

		const notifications = Array.from(userDb.notifications?.entries() || []);
		const unreadNotifications = notifications.filter(([_, notif]: any) => !notif.read);

		if (unreadNotifications.length === 0) {
			return interaction.editReply("❌ Você não tem notificações não lidas!");
		}

		let currentPage = 0;

		const generateEmbed = (page: number) => {
			const [id, notif]: any = unreadNotifications[page];
			
			const embed = new EmbedBuilder()
				.setColor("#FFFFFF")
				.setDescription(`## 🔔 Notificação ${page + 1}/${unreadNotifications.length}`)
				.addFields({
					name: "Mensagem",
					value: notif.message || "Sem mensagem",
				}, {
					name: "Data",
					value: notif.timestamp ? `<t:${Math.floor(new Date(notif.timestamp).getTime() / 1000)}:R>` : "Data desconhecida",
				});

			return { embed, notificationId: id };
		};

		const generateButtons = (page: number, total: number) => {
			const row = new ActionRowBuilder<ButtonBuilder>();

			const prevBtn = new ButtonBuilder()
				.setCustomId("prev")
				.setLabel("Anterior")
				.setStyle(ButtonStyle.Primary)
				.setDisabled(page === 0);

			const markReadBtn = new ButtonBuilder()
				.setCustomId("mark_read")
				.setLabel("Marcar como lida")
				.setStyle(ButtonStyle.Success);

			const deleteBtn = new ButtonBuilder()
				.setCustomId("delete")
				.setLabel("Remover")
				.setStyle(ButtonStyle.Danger);

			const nextBtn = new ButtonBuilder()
				.setCustomId("next")
				.setLabel("Próxima")
				.setStyle(ButtonStyle.Primary)
				.setDisabled(page === total - 1);

			row.addComponents(prevBtn, markReadBtn, deleteBtn, nextBtn);
			return row;
		};

		const { embed, notificationId } = generateEmbed(currentPage);
		const message = await interaction.editReply({
			embeds: [embed],
			components: [generateButtons(currentPage, unreadNotifications.length)]
		});

		const collector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 300000
		});

		collector.on("collect", async (i) => {
			if (i.user.id !== interaction.user.id) {
				return i.reply({ content: "❌ Essa interação não é sua!", flags: ["Ephemeral"] });
			}

			await i.deferUpdate();

			if (i.customId === "prev") {
				currentPage = Math.max(0, currentPage - 1);
			} else if (i.customId === "next") {
				currentPage = Math.min(unreadNotifications.length - 1, currentPage + 1);
			} else if (i.customId === "mark_read") {
				const [id] = unreadNotifications[currentPage];
				const notif = userDb.notifications?.get(id);
				
				if (notif) {
					notif.read = true;
					userDb.notifications?.set(id, notif);
					await userDb.save();
					
					unreadNotifications.splice(currentPage, 1);
					
					if (unreadNotifications.length === 0) {
						await userDb.updateOne({ notifications_viewed: true });
						return i.editReply({
							content: "✅ Todas as notificações foram marcadas como lidas!",
							embeds: [],
							components: [],
						});
					}
					
					if (currentPage >= unreadNotifications.length) {
						currentPage = unreadNotifications.length - 1;
					}
				}
			} else if (i.customId === "delete") {
				const [id] = unreadNotifications[currentPage];
				userDb.notifications?.delete(id);
				await userDb.save();
				
				unreadNotifications.splice(currentPage, 1);
				
				if (unreadNotifications.length === 0) {
					await userDb.updateOne({ notifications_viewed: true });
					return i.editReply({
						content: "✅ Todas as notificações foram removidas!",
					});
				}
				
				if (currentPage >= unreadNotifications.length) {
					currentPage = unreadNotifications.length - 1;
				}
			}

			const { embed: newEmbed } = generateEmbed(currentPage);
			await i.editReply({
				embeds: [newEmbed],
				components: [generateButtons(currentPage, unreadNotifications.length)]
			});
		});

		collector.on("end", () => {
			interaction.editReply({ components: [] }).catch(() => {});
		});
	}
} as ApplicationCommandStructure;
