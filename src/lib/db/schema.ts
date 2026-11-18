import {
  boolean,
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const memberRole = pgEnum("member_role", ["member", "admin"]);
export const eventStatus = pgEnum("santa_event_status", ["open", "locked", "drawn"]);
export const giftChannel = pgEnum("gift_channel", ["online", "physical"]);
export const santaUpdateKind = pgEnum("santa_update_kind", ["wishlist_request", "sent", "delivered_all", "partially_delivered", "custom", "address_changed"]);
export const submissionStatus = pgEnum("submission_status", ["pending", "approved", "rejected"]);

export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  authSubject: text("auth_subject").notNull().unique(),
  displayName: text("display_name").notNull(),
  accountDisplayName: text("account_display_name").notNull().default(""),
  avatarUrl: text("avatar_url"),
  christmasNote: text("christmas_note").notNull().default(""),
  discordUsername: text("discord_username").notNull().default(""),
  email: text("email").notNull().unique(),
  role: memberRole("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passwordRecoveryRequests = pgTable("password_recovery_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  tokenHash: text("token_hash"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  tokenUsedAt: timestamp("token_used_at", { withTimezone: true }),
});

export const activityLocks = pgTable("activity_locks", {
  activityId: text("activity_id").primaryKey(),
  isLocked: boolean("is_locked").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const missions = pgTable("missions", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  externalUrl: text("external_url"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const missionSubmissions = pgTable("mission_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  submittedUrl: text("submitted_url").notNull(),
  status: submissionStatus("status").notNull().default("pending"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
}, (table) => [unique("mission_submission_member_unique").on(table.missionId, table.memberId)]);

export const santaEvents = pgTable("santa_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  status: eventStatus("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const santaParticipants = pgTable("santa_participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => santaEvents.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  joinsOnline: boolean("joins_online").notNull().default(false),
  joinsPhysical: boolean("joins_physical").notNull().default(false),
  displayName: text("display_name"),
  shippingAddress: text("shipping_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("santa_participant_event_member_unique").on(table.eventId, table.memberId),
  check("santa_participant_joins_at_least_one", sql`${table.joinsOnline} or ${table.joinsPhysical}`),
  check("online_player_needs_display_name", sql`not ${table.joinsOnline} or ${table.displayName} is not null`),
  check("physical_player_needs_address", sql`not ${table.joinsPhysical} or ${table.shippingAddress} is not null`),
]);

export const wishlistItems = pgTable("wishlist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => santaEvents.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  channel: giftChannel("channel").notNull(),
  item: text("item").notNull(),
  isAvoid: boolean("is_avoid").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const santaAssignments = pgTable("santa_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => santaEvents.id, { onDelete: "cascade" }),
  giverMemberId: uuid("giver_member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  recipientMemberId: uuid("recipient_member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  channel: giftChannel("channel").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("santa_assignment_giver_channel_unique").on(table.eventId, table.giverMemberId, table.channel),
  unique("santa_assignment_recipient_channel_unique").on(table.eventId, table.recipientMemberId, table.channel),
  check("santa_assignment_no_self_match", sql`${table.giverMemberId} <> ${table.recipientMemberId}`),
]);

export const wishlistAlerts = pgTable("wishlist_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => santaEvents.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  channel: giftChannel("channel").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export const santaAssignmentUpdates = pgTable("santa_assignment_updates", {
  id: uuid("id").defaultRandom().primaryKey(),
  assignmentId: uuid("assignment_id").notNull().references(() => santaAssignments.id, { onDelete: "cascade" }),
  kind: santaUpdateKind("kind").notNull(),
  message: text("message").notNull().default(""),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const treeOrnaments = pgTable("tree_ornaments", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  greeting: text("greeting").notNull(),
  pageNumber: integer("page_number").notNull().default(1),
  slot: integer("slot").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique("tree_ornament_page_slot_unique").on(table.pageNumber, table.slot)]);

export const christmasPeople = pgTable("christmas_people", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const christmasPeopleMessages = pgTable("christmas_people_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  personId: uuid("person_id").notNull().references(() => christmasPeople.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  paperColor: text("paper_color").notNull().default("cream"),
  inkColor: text("ink_color").notNull().default("forest"),
  isBold: boolean("is_bold").notNull().default(false),
  isItalic: boolean("is_italic").notNull().default(false),
  isUnderline: boolean("is_underline").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const christmasSnackTrays = pgTable("christmas_snack_trays", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  syrup: text("syrup").notNull(),
  toppings: jsonb("toppings").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  items: jsonb("items").$type<{ key: string; x: number; y: number; rotation: number }[]>().notNull().default(sql`'[]'::jsonb`),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const christmasWeekTasks = pgTable("christmas_week_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentTaskId: uuid("parent_task_id"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  requiredPosts: integer("required_posts").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const christmasWeekProgress = pgTable("christmas_week_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull().references(() => christmasWeekTasks.id, { onDelete: "cascade" }),
  memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  postNumber: integer("post_number").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique("christmas_week_progress_post_unique").on(table.taskId, table.memberId, table.postNumber)]);
