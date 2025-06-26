CREATE TABLE "approval_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_request_id" integer NOT NULL,
	"approver_employee_number" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"comments" text,
	"approval_level" integer NOT NULL,
	"action_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approval_matrix" (
	"id" serial PRIMARY KEY NOT NULL,
	"department" varchar(100) NOT NULL,
	"location" varchar(100) NOT NULL,
	"level" integer NOT NULL,
	"approver_employee_number" varchar(50) NOT NULL,
	"approver_name" varchar(255) NOT NULL,
	"min_amount" numeric(15, 2) DEFAULT '0',
	"max_amount" numeric(15, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approval_workflow" (
	"id" serial PRIMARY KEY NOT NULL,
	"department" varchar(100) NOT NULL,
	"location" varchar(100) NOT NULL,
	"approval_level" integer NOT NULL,
	"approver_employee_number" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_request_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"head_of_department" varchar(255),
	"cost_center" varchar(100),
	"entity_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"parent_entity_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "entities_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "escalation_matrix" (
	"id" serial PRIMARY KEY NOT NULL,
	"site" varchar(100) NOT NULL,
	"location" varchar(100) NOT NULL,
	"escalation_days" integer NOT NULL,
	"escalation_level" integer NOT NULL,
	"approver_name" varchar(255) NOT NULL,
	"approver_email" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"type" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"quantity" integer DEFAULT 0,
	"unit_of_measure" varchar(50) NOT NULL,
	"location" varchar(255),
	"min_stock_level" integer DEFAULT 0,
	"max_stock_level" integer,
	"unit_cost" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "inventory_item_code_unique" UNIQUE("item_code")
);
--> statement-breakpoint
CREATE TABLE "line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_request_id" integer NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"required_quantity" integer NOT NULL,
	"unit_of_measure" varchar(50) NOT NULL,
	"required_by_date" timestamp NOT NULL,
	"delivery_location" varchar(255) NOT NULL,
	"estimated_cost" numeric(12, 2) NOT NULL,
	"item_justification" text,
	"stock_available" integer DEFAULT 0,
	"stock_location" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"postal_code" varchar(20),
	"entity_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "locations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"purchase_request_id" integer,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"requisition_number" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"request_date" timestamp NOT NULL,
	"department" varchar(100) NOT NULL,
	"location" varchar(100) NOT NULL,
	"business_justification_code" varchar(50) NOT NULL,
	"business_justification_details" text NOT NULL,
	"status" varchar(50) DEFAULT 'submitted' NOT NULL,
	"current_approval_level" integer DEFAULT 1 NOT NULL,
	"total_estimated_cost" numeric(15, 2) DEFAULT '0' NOT NULL,
	"requester_id" integer NOT NULL,
	"current_approver_employee_number" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "purchase_requests_requisition_number_unique" UNIQUE("requisition_number")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"level" integer DEFAULT 1,
	"permissions" text[] DEFAULT '{}'::text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_number" varchar(50) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"mobile" varchar(20),
	"department" varchar(100) NOT NULL,
	"location" varchar(100) NOT NULL,
	"password" text NOT NULL,
	"role" varchar(50) DEFAULT 'requester' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_employee_number_unique" UNIQUE("employee_number"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"postal_code" varchar(20),
	"category" varchar(100),
	"payment_terms" varchar(100),
	"tax_id" varchar(100),
	"bank_details" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vendors_vendor_code_unique" UNIQUE("vendor_code")
);
--> statement-breakpoint
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_purchase_request_id_purchase_requests_id_fk" FOREIGN KEY ("purchase_request_id") REFERENCES "public"."purchase_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_approver_employee_number_users_employee_number_fk" FOREIGN KEY ("approver_employee_number") REFERENCES "public"."users"("employee_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_workflow" ADD CONSTRAINT "approval_workflow_approver_employee_number_users_employee_number_fk" FOREIGN KEY ("approver_employee_number") REFERENCES "public"."users"("employee_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_purchase_request_id_purchase_requests_id_fk" FOREIGN KEY ("purchase_request_id") REFERENCES "public"."purchase_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_purchase_request_id_purchase_requests_id_fk" FOREIGN KEY ("purchase_request_id") REFERENCES "public"."purchase_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_purchase_request_id_purchase_requests_id_fk" FOREIGN KEY ("purchase_request_id") REFERENCES "public"."purchase_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_current_approver_employee_number_users_employee_number_fk" FOREIGN KEY ("current_approver_employee_number") REFERENCES "public"."users"("employee_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");