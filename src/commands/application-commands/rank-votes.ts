import type { ApplicationCommandStructure } from "../../types";
import { botSchema } from "../../schemas/Bot";

export default {
	name: "rank-votes",
	async run(client, interaction) {
		const bots = await botSchema.find({});

		bots.sort((a, b) => {
			const totalVotesA = a.votes.reduce((a, b) => a + b.votes, 0);
			const totalVotesB = b.votes.reduce((a, b) => a + b.votes, 0);
			return totalVotesB - totalVotesA;
		});

		const botmap = bots.map((bot, index) => {
			const totalVotes = bot.votes.reduce((a, b) => a + b.votes, 0);
			return `**${index + 1}.** ${bot.name} - ${totalVotes} votos`;
		});

		await interaction.reply({
			content: botmap.splice(0, 10).join("\n"),
		});
	}
} as ApplicationCommandStructure;
