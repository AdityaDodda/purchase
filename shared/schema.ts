import { pgTable, text, varchar, serial, integer, timestamp, decimal, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// Session storage table (required for auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  employeeNumber: varchar("employee_number", { length: 50 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  mobile: varchar("mobile", { length: 20 }),
  department: varchar("department", { length: 100 }).notNull(),
  location: varchar("location", { length: 100 }).notNull(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("requester"), // requester, approver, admin
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase Requests table
export const purchaseRequests = pgTable("purchase_requests", {
  id: serial("id").primaryKey(),
  requisitionNumber: varchar("requisition_number", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  requestDate: timestamp("request_date").notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  location: varchar("location", { length: 100 }).notNull(),
  businessJustificationCode: varchar("business_justification_code", { length: 50 }).notNull(),
  businessJustificationDetails: text("business_justification_details").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("submitted"), // submitted, pending, approved, rejected, returned, cancelled
  currentApprovalLevel: integer("current_approval_level").notNull().default(1),
  totalEstimatedCost: decimal("total_estimated_cost", { precision: 15, scale: 2 }).notNull().default("0"),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  
  // --- INTERMEDIATE MIGRATION STEP ---
  // Keep the old column (as nullable) to preserve data during migration.
  currentApproverId: integer("current_approver_id").references(() => users.id),
  
  // Add the new column (as nullable) so it can be added to existing tables.
  currentApproverEmployeeNumber: varchar("current_approver_employee_number", { length: 50 })
    .references(() => users.employeeNumber),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Line Items table
export const lineItems = pgTable("line_items", {
  id: serial("id").primaryKey(),
  purchaseRequestId: integer("purchase_request_id").notNull().references(() => purchaseRequests.id, { onDelete: "cascade" }),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  requiredQuantity: integer("required_quantity").notNull(),
  unitOfMeasure: varchar("unit_of_measure", { length: 50 }).notNull(),
  requiredByDate: timestamp("required_by_date").notNull(),
  deliveryLocation: varchar("delivery_location", { length: 255 }).notNull(),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }).notNull(),
  itemJustification: text("item_justification"),
  stockAvailable: integer("stock_available").default(0),
  stockLocation: varchar("stock_location", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attachments table
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  purchaseRequestId: integer("purchase_request_id").notNull().references(() => purchaseRequests.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Approval History (Audit Log): logs all actions
export const approvalHistory = pgTable("approval_history", {
  id: serial("id").primaryKey(),
  purchaseRequestId: integer("purchase_request_id").notNull().references(() => purchaseRequests.id, { onDelete: "cascade" }),
  
  // --- INTERMEDIATE MIGRATION STEP ---
  // Keep the old column (as nullable).
  approverId: integer("approver_id").references(() => users.id),

  // Add the new column (as nullable).
  approverEmployeeNumber: varchar("approver_employee_number", { length: 50 })
    .references(() => users.employeeNumber),
  
  action: varchar("action", { length: 50 }).notNull(),
  comments: text("comments"),
  approvalLevel: integer("approval_level").notNull(),
  actionDate: timestamp("action_date").defaultNow(),
});

// Approval Workflow table: user-based, max 2 levels per dept/location
export const approvalWorkflow = pgTable("approval_workflow", {
  id: serial("id").primaryKey(),
  department: varchar("department", { length: 100 }).notNull(),
  location: varchar("location", { length: 100 }).notNull(),
  approvalLevel: integer("approval_level").notNull(), // 1 or 2

  // --- INTERMEDIATE MIGRATION STEP ---
  // Keep the old column (as nullable).
  approverId: integer("approver_id").references(() => users.id),

  // Add the new column (as nullable).
  approverEmployeeNumber: varchar("approver_employee_number", { length: 50 })
    .references(() => users.employeeNumber),

  isActive: boolean("is_active").notNull().default(true),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  purchaseRequestId: integer("purchase_request_id").references(() => purchaseRequests.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // info, warning, success, error
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  purchaseRequests: many(purchaseRequests),
  approvalHistory: many(approvalHistory),
  approvalWorkflow: many(approvalWorkflow),
  notifications: many(notifications),
}));

export const purchaseRequestsRelations = relations(purchaseRequests, ({ one, many }) => ({
  requester: one(users, {
    fields: [purchaseRequests.requesterId],
    references: [users.id],
  }),
  // --- INTERMEDIATE MIGRATION STEP: Define relations for both keys ---
  currentApprover: one(users, {
    fields: [purchaseRequests.currentApproverEmployeeNumber],
    references: [users.employeeNumber],
  }),
  currentApproverById: one(users, { // Relation for the old key
    fields: [purchaseRequests.currentApproverId],
    references: [users.id],
    relationName: 'currentApproverById'
  }),
  lineItems: many(lineItems),
  attachments: many(attachments),
  approvalHistory: many(approvalHistory),
  notifications: many(notifications),
}));

export const lineItemsRelations = relations(lineItems, ({ one }) => ({
  purchaseRequest: one(purchaseRequests, {
    fields: [lineItems.purchaseRequestId],
    references: [purchaseRequests.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  purchaseRequest: one(purchaseRequests, {
    fields: [attachments.purchaseRequestId],
    references: [purchaseRequests.id],
  }),
}));

export const approvalHistoryRelations = relations(approvalHistory, ({ one }) => ({
  purchaseRequest: one(purchaseRequests, {
    fields: [approvalHistory.purchaseRequestId],
    references: [purchaseRequests.id],
  }),
  // --- INTERMEDIATE MIGRATION STEP: Define relations for both keys ---
  approver: one(users, {
    fields: [approvalHistory.approverEmployeeNumber],
    references: [users.employeeNumber],
  }),
  approverById: one(users, { // Relation for the old key
    fields: [approvalHistory.approverId],
    references: [users.id],
    relationName: 'approverById'
  }),
}));

export const approvalWorkflowRelations = relations(approvalWorkflow, ({ one }) => ({
  // --- INTERMEDIATE MIGRATION STEP: Define relations for both keys ---
  approver: one(users, {
    fields: [approvalWorkflow.approverEmployeeNumber],
    references: [users.employeeNumber],
  }),
  approverById: one(users, { // Relation for the old key
    fields: [approvalWorkflow.approverId],
    references: [users.id],
    relationName: 'workflowApproverById'
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  purchaseRequest: one(purchaseRequests, {
    fields: [notifications.purchaseRequestId],
    references: [purchaseRequests.id],
  }),
}));

// Master Data Tables for Admin System
// ... (The rest of the file is unchanged) ...

// Entity Master
export const entities = pgTable("entities", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentEntityId: integer("parent_entity_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Department Master
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  headOfDepartment: varchar("head_of_department", { length: 255 }),
  costCenter: varchar("cost_center", { length: 100 }),
  entityId: integer("entity_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Location Master
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  entityId: integer("entity_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Role Master
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  level: integer("level").default(1),
  permissions: text("permissions").array().default(sql`'{}'::text[]`),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Approval Matrix Master
export const approvalMatrix = pgTable("approval_matrix", {
  id: serial("id").primaryKey(),
  department: varchar("department", { length: 100 }).notNull(),
  location: varchar("location", { length: 100 }).notNull(),
  level: integer("level").notNull(),
  approverEmployeeNumber: varchar("approver_employee_number", { length: 50 }).notNull(),
  approverName: varchar("approver_name", { length: 255 }).notNull(),
  minAmount: decimal("min_amount", { precision: 15, scale: 2 }).default("0"),
  maxAmount: decimal("max_amount", { precision: 15, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Escalation Matrix Master
export const escalationMatrix = pgTable("escalation_matrix", {
  id: serial("id").primaryKey(),
  site: varchar("site", { length: 100 }).notNull(),
  location: varchar("location", { length: 100 }).notNull(),
  escalationDays: integer("escalation_days").notNull(),
  escalationLevel: integer("escalation_level").notNull(),
  approverName: varchar("approver_name", { length: 255 }).notNull(),
  approverEmail: varchar("approver_email", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory Master
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  itemCode: varchar("item_code", { length: 100 }).unique().notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  quantity: integer("quantity").default(0),
  unitOfMeasure: varchar("unit_of_measure", { length: 50 }).notNull(),
  location: varchar("location", { length: 255 }),
  minStockLevel: integer("min_stock_level").default(0),
  maxStockLevel: integer("max_stock_level"),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendor Master
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  vendorCode: varchar("vendor_code", { length: 100 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  category: varchar("category", { length: 100 }),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  taxId: varchar("tax_id", { length: 100 }),
  bankDetails: text("bank_details"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Master Data Relations
export const entitiesRelations = relations(entities, ({ one, many }) => ({
  parentEntity: one(entities, {
    fields: [entities.parentEntityId],
    references: [entities.id],
  }),
  departments: many(departments),
  locations: many(locations),
}));

export const departmentsRelations = relations(departments, ({ one }) => ({
  entity: one(entities, {
    fields: [departments.entityId],
    references: [entities.id],
  }),
}));

export const locationsRelations = relations(locations, ({ one }) => ({
  entity: one(entities, {
    fields: [locations.entityId],
    references: [entities.id],
  }),
}));

// Insert schemas for master data
export const insertEntitySchema = createInsertSchema(entities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApprovalMatrixSchema = createInsertSchema(approvalMatrix).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEscalationMatrixSchema = createInsertSchema(escalationMatrix).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports for master data
export type Entity = typeof entities.$inferSelect;
export type InsertEntity = z.infer<typeof insertEntitySchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type ApprovalMatrix = typeof approvalMatrix.$inferSelect;
export type InsertApprovalMatrix = z.infer<typeof insertApprovalMatrixSchema>;
export type EscalationMatrix = typeof escalationMatrix.$inferSelect;
export type InsertEscalationMatrix = z.infer<typeof insertEscalationMatrixSchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseRequestSchema = createInsertSchema(purchaseRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLineItemSchema = createInsertSchema(lineItems).omit({
  id: true,
  createdAt: true,
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  uploadedAt: true,
});

export const insertApprovalHistorySchema = createInsertSchema(approvalHistory).omit({
  id: true,
  actionDate: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PurchaseRequest = typeof purchaseRequests.$inferSelect;
export type InsertPurchaseRequest = z.infer<typeof insertPurchaseRequestSchema>;
export type LineItem = typeof lineItems.$inferSelect;
export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type ApprovalHistory = typeof approvalHistory.$inferSelect;
export type InsertApprovalHistory = z.infer<typeof insertApprovalHistorySchema>;
export type ApprovalWorkflow = typeof approvalWorkflow.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;