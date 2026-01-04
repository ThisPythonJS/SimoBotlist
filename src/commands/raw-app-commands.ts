import { ApplicationCommandData, ApplicationCommandType, ApplicationCommandOptionType } from "discord.js";

export const JSONStructure: ApplicationCommandData[] = [
    {
        name: "ping",
        type: ApplicationCommandType.ChatInput,
        description: "Veja como o Simo está operando",
        options: [
            {
                name: "shard",
                description: "Veja a latência de um fragmento específico",
                type: ApplicationCommandOptionType.Integer,
                min_value: 0,
                required: false
            }
        ]
    },
    {
        name: "queue",
        type: ApplicationCommandType.ChatInput,
        description: "Veja os bots pendentes para serem analisados",
    },
    {
        name: "decode",
        type: ApplicationCommandType.ChatInput,
        description: "Descriptografique seu token recebido pelo site",
        options: [
            {
                name: "token",
                description: "Insira o jwt abaixo",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
		 },
	{
			name: "rank-votes",
		  type: ApplicationCommandType.ChatInput,
		  description: "Veja um rank de votos de bots.",
	},
	{
			name: "status",
		  type: ApplicationCommandType.ChatInput,
		  description: "Veja os status da Simo api.",
	},
	  {
    name: "user-info",
    type: ApplicationCommandType.ChatInput,
    description: "Retorna infos do usuário mencionado na database da Simo",
    options: [
      {
        name: "user",
        description: "Mencione um usuário para buscar informações",
        type: ApplicationCommandOptionType.User,
        required: false
      }
    ]
	  },
];
