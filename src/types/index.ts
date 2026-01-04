import { ExtendedClient } from "../Client";
import { Message, AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";

type Snowflake = string;

export interface CommandStructure {
    name: string;
    aliases?: string[];
    run(client: ExtendedClient, message: Message<true>, args: string[]): Promise<unknown>;
};

export interface ApplicationCommandStructure {
    name: string;
    autocomplete?: (interaction: AutocompleteInteraction) => unknown;
    run?: (client: ExtendedClient, interaction: ChatInputCommandInteraction) => Promise<unknown>;
};

export interface BotStructure {
    _id: Snowflake;
    name: string;
    avatar: string | null;
    invite_url: string;
    website_url?: string;
    support_server?: string;
    source_code?: string;
    short_description: string;
    long_description: string;
    prefixes: string[];
    owner_id: Snowflake;
    created_at: string;
    verified: boolean;
    tags: string[];
    approved: boolean;
    api_key?: string;
    votes: VoteStructure[];
    banner_url: string;
    team_id: string;
    vote_message: string | null;
}

export interface VoteStructure {
    votes: number;
    user: Snowflake;
    last_vote: string;
}

export interface UserStructure {
    _id: Snowflake;
    username: string;
    avatar: string | null;
    notifications: Map<string, NotificationBody>;
    bio: string | null;
    notifications_viewed: boolean;
    banner_url: string | null;
    flags: UserFlags;
    premium_type: PremiumType;
}

export interface ApiStatusStructure {
    total_mem: number;
    free_mem: number;
    users: number;
    bots: number;
    uptime: number;
    request_count: number;
}

export interface Team {
    members?: TeamMember[];
    id?: string;
    name: string;
    avatar_url: string;
    description: string;
    bot_id?: Snowflake;
}

export interface TeamMember {
    id: Snowflake;
    permission: TeamPermissions;
    owner?: boolean;
}

export enum TeamPermissions {
    Administrator,
    ReadOnly,
}

export enum UserFlags {
    BugHunter,
    Contributor,
    PremiumPartner,
    Developer,
}

export enum PremiumType {
    None,
    Basic,
    Advanced,
}

export interface NotificationBody {
    content: string;
    sent_at: string;
    type: NotificationType;
    url?: string;
}

export enum NotificationType {
    Comment,
    ApprovedBot,
    RefusedBot,
    Mixed,
}