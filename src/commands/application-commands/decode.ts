import type { ApplicationCommandStructure } from "../../types";
import * as jwt from "jsonwebtoken";

export default {
    name: "decode",
    async run(client, interaction) {
        const token: string | null= interaction.options.getString("token");

        if (!token) return;
        
        const oi: string | jwt.JwtPayload | null = jwt.decode(token);

        interaction.reply({ content: `\`\`\`js\n${JSON.stringify(oi, null, "\t")}\`\`\`` });
    }
} as ApplicationCommandStructure;