import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  googleId: text('google_id').unique(),
  githubId: text('github_id').unique(),
  githubAccessToken: text('github_access_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  phase: text('phase').notNull().default('domain_discovery'),
  identityModel: jsonb('identity_model').notNull().default('{}'),
  domainHints: jsonb('domain_hints'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const conversationMessages = pgTable('conversation_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  identityModelDelta: jsonb('identity_model_delta'),
  phase: text('phase').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const publishedSkills = pgTable('published_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  skillName: text('skill_name').notNull(),
  githubRepoUrl: text('github_repo_url').notNull(),
  githubRepoOwner: text('github_repo_owner').notNull(),
  installCommand: text('install_command').notNull(),
  identityModel: jsonb('identity_model').notNull(),
  skillFiles: jsonb('skill_files').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow(),
})

export const artifacts = pgTable('artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  type: text('type').notNull(),
  source: text('source').notNull(),
  analysis: jsonb('analysis'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
