import { Client, ActivityType } from "discord.js";
import { client } from "../../index";

client.once('clientReady', () => {
    if (!client.user) return;
    
    const statuses = [
        { name: (ping: number) => `⚡ simobotlist.online [${ping}ms]`, type: ActivityType.Custom },
        { name: (ping: number) => `✨ discord.gg/simo [${ping}ms]`, type: ActivityType.Custom },
    ];
    
    let currentIndex = 0;
    
    const updateStatus = () => {
        const ping = client.ws.ping > 0 ? client.ws.ping : 0;
        const status = statuses[currentIndex];
        
        client.user?.setActivity(status.name(ping), {
            type: status.type
        });
        
        currentIndex = (currentIndex + 1) % statuses.length;
    };
    
    updateStatus();
    
    setInterval(updateStatus, 15000);
});
