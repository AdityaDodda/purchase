ALTER TABLE "approval_history" ALTER COLUMN "approver_employee_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "approval_workflow" ALTER COLUMN "approver_employee_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "approval_history" ADD COLUMN "approver_id" integer;--> statement-breakpoint
ALTER TABLE "approval_workflow" ADD COLUMN "approver_id" integer;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD COLUMN "current_approver_id" integer;--> statement-breakpoint
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_workflow" ADD CONSTRAINT "approval_workflow_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_current_approver_id_users_id_fk" FOREIGN KEY ("current_approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;