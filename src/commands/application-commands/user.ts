import type { ApplicationCommandStructure } from "../../types";
import { userSchema } from "../../schemas/User";
import { botSchema } from "../../schemas/Bot";
import { 
	ButtonBuilder, 
	ButtonStyle, 
	ActionRowBuilder, 
	ContainerBuilder,
	SectionBuilder,
	TextDisplayBuilder,
	MediaGalleryBuilder,
	SeparatorBuilder,
	MessageFlags,
	AttachmentBuilder
} from "discord.js";

export default {
	name: "user",
	async run(client, interaction) {
		await interaction.deferReply();
		
		const user = interaction.options.getUser("user") || interaction.user;
		const userDb = await userSchema.findById(user.id);
        
		if (!userDb) {
			return interaction.editReply({
				content: "❌ Usuário não encontrado no banco de dados.\n🔹 Registre-se aqui: https://simobotlist.online/login"
			});
		}
        
		const sub = interaction.options.getSubcommand();

        if (sub === "info") {
		const userBots = await botSchema.find({ owner_id: user.id });
		const fetchedUser = await client.users.fetch(user.id, { force: true });
		const discordBanner = fetchedUser.bannerURL({ size: 4096, extension: 'png' });
		const customBanner = userDb?.banner_url;
		const avatarURL = user.displayAvatarURL({ size: 256 });

		const container = new ContainerBuilder()
			.setAccentColor(0xFFFFFF);

		const headerSection = new SectionBuilder()
			.addTextDisplayComponents((textDisplay) => 
				textDisplay.setContent(`## ⚡ Informações do Usuário`)
			)
			.setThumbnailAccessory((thumbnail) => 
				thumbnail.setURL(avatarURL)
			);

		container.addSectionComponents(headerSection);

		container.addTextDisplayComponents((textDisplay) => 
			textDisplay.setContent(`**Usuário**\n\`${userDb.username}\`\n-# ╰ \`${userDb._id}\``)
		);

		container.addSeparatorComponents((separator) => separator);

		container.addTextDisplayComponents((textDisplay) => 
			textDisplay.setContent(`**Biografia**\n${userDb?.bio || "\`Nenhuma biografia definida\`"}`)
		);

		container.addSeparatorComponents((separator) => separator);

		container.addTextDisplayComponents((textDisplay) => 
			textDisplay.setContent(
				`**Aplicações**\n${userBots.length 
					? userBots.map((bot: any) => `[**${bot.name}**](https://simobotlist.online/bot/${bot._id})`).join(", ") 
					: "Nenhum bot adicionado"
				}`
			)
		);

		if (customBanner || discordBanner) {
			container.addSeparatorComponents((separator) => separator);
			
			const galleryItems = [];
			
			if (customBanner) {
				galleryItems.push((item: any) => 
					item
						.setURL(customBanner)
						.setDescription("Banner Customizado")
				);
			}
			
			if (discordBanner) {
				galleryItems.push((item: any) => 
					item
						.setURL(discordBanner)
						.setDescription("Banner do Discord")
				);
			}

			const gallery = new MediaGalleryBuilder().addItems(...galleryItems);
			container.addMediaGalleryComponents(gallery);
		}

		const profileButton = new ButtonBuilder()
			.setLabel("Link do Perfil")
			.setStyle(ButtonStyle.Link)
			.setEmoji("🔗")
			.setURL(`https://simobotlist.online/user/${userDb._id}`);

		const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(profileButton);
		container.addActionRowComponents(actionRow);

		return interaction.editReply({
			components: [container],
			flags: MessageFlags.IsComponentsV2
		});
	} else {
      return interaction.editReply({
		content: "Hm... Eu não achei esse sub-comando, tem certeza que ele existe? Entre em contato com a Equipe da Simo."
	  })
	}
  }
} as ApplicationCommandStructure;