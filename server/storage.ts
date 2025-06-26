import {
  users,
  purchaseRequests,
  lineItems,
  attachments,
  approvalHistory,
  approvalWorkflow,
  notifications,
  entities,
  departments,
  locations,
  roles,
  approvalMatrix,
  escalationMatrix,
  inventory,
  vendors,
  type User,
  type InsertUser,
  type PurchaseRequest,
  type InsertPurchaseRequest,
  type LineItem,
  type InsertLineItem,
  type Attachment,
  type InsertAttachment,
  type ApprovalHistory,
  type InsertApprovalHistory,
  type ApprovalWorkflow,
  type Notification,
  type InsertNotification,
  type Entity,
  type InsertEntity,
  type Department,
  type InsertDepartment,
  type Location,
  type InsertLocation,
  type Role,
  type InsertRole,
  type ApprovalMatrix,
  type InsertApprovalMatrix,
  type EscalationMatrix,
  type InsertEscalationMatrix,
  type Inventory,
  type InsertInventory,
  type Vendor,
  type InsertVendor,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sum, sql, gte, lte, like, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmployeeNumber(employeeNumber: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  updateUserPassword(id: number, password: string): Promise<void>;
  getApproversByDepartmentLocation(department: string, location: string): Promise<User[]>;

  // Purchase Request operations
  createPurchaseRequest(request: InsertPurchaseRequest): Promise<PurchaseRequest>;
  getPurchaseRequest(id: number): Promise<PurchaseRequest | undefined>;
  getPurchaseRequestWithDetails(id: number): Promise<any>;
  updatePurchaseRequest(id: number, request: Partial<InsertPurchaseRequest>): Promise<PurchaseRequest>;
  getPurchaseRequestsByUser(userId: number, filters?: any): Promise<PurchaseRequest[]>;
  getAllPurchaseRequests(filters?: any): Promise<PurchaseRequest[]>;
  getPurchaseRequestStats(): Promise<any>;
  getPurchaseRequestStatsByUser(userId: number): Promise<any>;
  generateRequisitionNumber(department: string): Promise<string>;

  // Line Item operations
  createLineItem(lineItem: InsertLineItem): Promise<LineItem>;
  getLineItemsByRequest(requestId: number): Promise<LineItem[]>;
  updateLineItem(id: number, lineItem: Partial<InsertLineItem>): Promise<LineItem>;
  deleteLineItem(id: number): Promise<void>;

  // Attachment operations
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  getAttachmentsByRequest(requestId: number): Promise<Attachment[]>;
  deleteAttachment(id: number): Promise<void>;

  // Approval operations
  createApprovalHistory(approval: InsertApprovalHistory): Promise<ApprovalHistory>;
  getApprovalHistoryByRequest(requestId: number): Promise<ApprovalHistory[]>;
  getApprovalWorkflow(department: string, location: string): Promise<ApprovalWorkflow[]>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;

  // Master Data operations for Admin system
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;
  
  // Entity Master operations
  getAllEntities(): Promise<Entity[]>;
  createEntity(entity: InsertEntity): Promise<Entity>;
  updateEntity(id: number, entity: Partial<InsertEntity>): Promise<Entity>;
  deleteEntity(id: number): Promise<void>;
  
  // Department Master operations
  getAllDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department>;
  deleteDepartment(id: number): Promise<void>;
  
  // Location Master operations
  getAllLocations(): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, location: Partial<InsertLocation>): Promise<Location>;
  deleteLocation(id: number): Promise<void>;
  
  // Role Master operations
  getAllRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: number): Promise<void>;
  
  // Approval Matrix operations
  getAllApprovalMatrix(): Promise<ApprovalMatrix[]>;
  createApprovalMatrix(matrix: InsertApprovalMatrix): Promise<ApprovalMatrix>;
  updateApprovalMatrix(id: number, matrix: Partial<InsertApprovalMatrix>): Promise<ApprovalMatrix>;
  deleteApprovalMatrix(id: number): Promise<void>;
  
  // Escalation Matrix operations
  getAllEscalationMatrix(): Promise<EscalationMatrix[]>;
  createEscalationMatrix(matrix: InsertEscalationMatrix): Promise<EscalationMatrix>;
  updateEscalationMatrix(id: number, matrix: Partial<InsertEscalationMatrix>): Promise<EscalationMatrix>;
  deleteEscalationMatrix(id: number): Promise<void>;
  
  // Inventory Master operations
  getAllInventory(): Promise<Inventory[]>;
  createInventory(item: InsertInventory): Promise<Inventory>;
  updateInventory(id: number, item: Partial<InsertInventory>): Promise<Inventory>;
  deleteInventory(id: number): Promise<void>;
  
  // Vendor Master operations
  getAllVendors(): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor>;
  deleteVendor(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmployeeNumber(employeeNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.employeeNumber, employeeNumber));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: number, password: string): Promise<void> {
    await db
      .update(users)
      .set({ password, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async getApproversByDepartmentLocation(department: string, location: string): Promise<User[]> {
    const approvers = await db
      .select({
        id: users.id,
        employeeNumber: users.employeeNumber,
        fullName: users.fullName,
        email: users.email,
        department: users.department,
        location: users.location,
        role: users.role,
      })
      .from(users)
      .innerJoin(approvalWorkflow, eq(users.id, approvalWorkflow.approverId))
      .where(
        and(
          eq(approvalWorkflow.department, department),
          eq(approvalWorkflow.location, location),
          eq(approvalWorkflow.isActive, true)
        )
      )
      .orderBy(asc(approvalWorkflow.approvalLevel));

    return approvers;
  }

  // Purchase Request operations
  async generateRequisitionNumber(department: string): Promise<string> {
    const deptCode = department.substring(0, 4).toUpperCase();
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const [{ count: requestCount }] = await db
      .select({ count: count() })
      .from(purchaseRequests)
      .where(like(purchaseRequests.requisitionNumber, `PR-${deptCode}-${yearMonth}-%`));

    const autoNo = String(requestCount + 1).padStart(3, '0');
    return `PR-${deptCode}-${yearMonth}-${autoNo}`;
  }

  async createPurchaseRequest(requestData: InsertPurchaseRequest): Promise<PurchaseRequest> {
    const [request] = await db
      .insert(purchaseRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async getPurchaseRequest(id: number): Promise<PurchaseRequest | undefined> {
    const [request] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, id));
    return request || undefined;
  }

  async getPurchaseRequestWithDetails(id: number): Promise<any> {
    const request = await db.query.purchaseRequests.findFirst({
      where: eq(purchaseRequests.id, id),
      with: {
        requester: true,
        currentApprover: true,
        lineItems: true,
        attachments: true,
        approvalHistory: {
          with: {
            approver: true,
          },
          orderBy: desc(approvalHistory.actionDate),
        },
      },
    });
    return request;
  }

  async updatePurchaseRequest(id: number, requestData: Partial<InsertPurchaseRequest>): Promise<PurchaseRequest> {
    const [request] = await db
      .update(purchaseRequests)
      .set({ ...requestData, updatedAt: new Date() })
      .where(eq(purchaseRequests.id, id))
      .returning();
    return request;
  }

  async getPurchaseRequestsByUser(userId: number, filters: any = {}): Promise<PurchaseRequest[]> {
    let query = db.query.purchaseRequests.findMany({
      where: eq(purchaseRequests.requesterId, userId),
      with: {
        requester: true,
        currentApprover: true,
      },
      orderBy: desc(purchaseRequests.createdAt),
    });

    // Note: Drizzle query builder filtering would need to be implemented differently
    // For now, returning all and filtering can be done at the API level
    const requests = await query;
    return requests;
  }

  async getAllPurchaseRequests(filters: any = {}): Promise<PurchaseRequest[]> {
    const whereClauses = [];
    if (filters.currentApproverId) {
      whereClauses.push(eq(purchaseRequests.currentApproverId, Number(filters.currentApproverId)));
    }
    if (filters.status) {
      whereClauses.push(eq(purchaseRequests.status, filters.status));
    }
    // Add more filters as needed
    const requests = await db.query.purchaseRequests.findMany({
      where: whereClauses.length > 0 ? and(...whereClauses) : undefined,
      with: {
        requester: true,
        currentApprover: true,
      },
      orderBy: desc(purchaseRequests.createdAt),
    });
    return requests;
  }

  async getPurchaseRequestStats(): Promise<any> {
    const [totalRequests] = await db.select({ count: count() }).from(purchaseRequests);
    const [pendingRequests] = await db
      .select({ count: count() })
      .from(purchaseRequests)
      .where(eq(purchaseRequests.status, 'pending'));
    const [approvedRequests] = await db
      .select({ count: count() })
      .from(purchaseRequests)
      .where(eq(purchaseRequests.status, 'approved'));
    const [rejectedRequests] = await db
      .select({ count: count() })
      .from(purchaseRequests)
      .where(eq(purchaseRequests.status, 'rejected'));

    const [totalValue] = await db
      .select({ sum: sum(purchaseRequests.totalEstimatedCost) })
      .from(purchaseRequests)
      .where(eq(purchaseRequests.status, 'approved'));

    return {
      totalRequests: totalRequests.count,
      pendingRequests: pendingRequests.count,
      approvedRequests: approvedRequests.count,
      rejectedRequests: rejectedRequests.count,
      totalValue: totalValue.sum || 0,
    };
  }

  async getPurchaseRequestStatsByUser(userId: number): Promise<any> {
    const [totalRequests] = await db
      .select({ count: count() })
      .from(purchaseRequests)
      .where(eq(purchaseRequests.requesterId, userId));
    const [pendingRequests] = await db
      .select({ count: count() })
      .from(purchaseRequests)
      .where(and(
        eq(purchaseRequests.requesterId, userId),
        eq(purchaseRequests.status, 'pending')
      ));
    const [approvedRequests] = await db
      .select({ count: count() })
      .from(purchaseRequests)
      .where(and(
        eq(purchaseRequests.requesterId, userId),
        eq(purchaseRequests.status, 'approved')
      ));
    const [rejectedRequests] = await db
      .select({ count: count() })
      .from(purchaseRequests)
      .where(and(
        eq(purchaseRequests.requesterId, userId),
        eq(purchaseRequests.status, 'rejected')
      ));

    const [totalValue] = await db
      .select({ sum: sum(purchaseRequests.totalEstimatedCost) })
      .from(purchaseRequests)
      .where(and(
        eq(purchaseRequests.requesterId, userId),
        eq(purchaseRequests.status, 'approved')
      ));

    return {
      totalRequests: totalRequests.count,
      pendingRequests: pendingRequests.count,
      approvedRequests: approvedRequests.count,
      rejectedRequests: rejectedRequests.count,
      totalValue: totalValue.sum || 0,
    };
  }

  // Line Item operations
  async createLineItem(lineItemData: InsertLineItem): Promise<LineItem> {
    const [lineItem] = await db
      .insert(lineItems)
      .values(lineItemData)
      .returning();
    return lineItem;
  }

  async getLineItemsByRequest(requestId: number): Promise<LineItem[]> {
    const items = await db
      .select()
      .from(lineItems)
      .where(eq(lineItems.purchaseRequestId, requestId))
      .orderBy(asc(lineItems.id));
    return items;
  }

  async updateLineItem(id: number, lineItemData: Partial<InsertLineItem>): Promise<LineItem> {
    const [lineItem] = await db
      .update(lineItems)
      .set(lineItemData)
      .where(eq(lineItems.id, id))
      .returning();
    return lineItem;
  }

  async deleteLineItem(id: number): Promise<void> {
    await db.delete(lineItems).where(eq(lineItems.id, id));
  }

  // Attachment operations
  async createAttachment(attachmentData: InsertAttachment): Promise<Attachment> {
    const [attachment] = await db
      .insert(attachments)
      .values(attachmentData)
      .returning();
    return attachment;
  }

  async getAttachmentsByRequest(requestId: number): Promise<Attachment[]> {
    const attachmentList = await db
      .select()
      .from(attachments)
      .where(eq(attachments.purchaseRequestId, requestId))
      .orderBy(asc(attachments.uploadedAt));
    return attachmentList;
  }

  async deleteAttachment(id: number): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
  }

  // Approval operations
  async createApprovalHistory(approvalData: InsertApprovalHistory): Promise<ApprovalHistory> {
    const [approval] = await db
      .insert(approvalHistory)
      .values(approvalData)
      .returning();
    return approval;
  }

  async getApprovalHistoryByRequest(requestId: number): Promise<ApprovalHistory[]> {
    const history = await db.query.approvalHistory.findMany({
      where: eq(approvalHistory.purchaseRequestId, requestId),
      with: {
        approver: true,
      },
      orderBy: desc(approvalHistory.actionDate),
    });
    return history;
  }

  async getApprovalWorkflow(department: string, location: string): Promise<ApprovalWorkflow[]> {
    const workflow = await db.query.approvalWorkflow.findMany({
      where: and(
        eq(approvalWorkflow.department, department),
        eq(approvalWorkflow.location, location),
        eq(approvalWorkflow.isActive, true)
      ),
      with: {
        approver: true,
      },
      orderBy: asc(approvalWorkflow.approvalLevel),
    });
    return workflow;
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
    return userNotifications;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // Master Data implementations for Admin system
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Entity Master implementations
  async getAllEntities(): Promise<Entity[]> {
    return await db.select().from(entities);
  }

  async createEntity(entityData: InsertEntity): Promise<Entity> {
    const [entity] = await db.insert(entities).values(entityData).returning();
    return entity;
  }

  async updateEntity(id: number, entityData: Partial<InsertEntity>): Promise<Entity> {
    const [entity] = await db.update(entities)
      .set({ ...entityData, updatedAt: new Date() })
      .where(eq(entities.id, id))
      .returning();
    return entity;
  }

  async deleteEntity(id: number): Promise<void> {
    await db.delete(entities).where(eq(entities.id, id));
  }

  // Department Master implementations
  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async createDepartment(departmentData: InsertDepartment): Promise<Department> {
    const [department] = await db.insert(departments).values(departmentData).returning();
    return department;
  }

  async updateDepartment(id: number, departmentData: Partial<InsertDepartment>): Promise<Department> {
    const [department] = await db.update(departments)
      .set({ ...departmentData, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return department;
  }

  async deleteDepartment(id: number): Promise<void> {
    await db.delete(departments).where(eq(departments.id, id));
  }

  // Location Master implementations
  async getAllLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async createLocation(locationData: InsertLocation): Promise<Location> {
    const [location] = await db.insert(locations).values(locationData).returning();
    return location;
  }

  async updateLocation(id: number, locationData: Partial<InsertLocation>): Promise<Location> {
    const [location] = await db.update(locations)
      .set({ ...locationData, updatedAt: new Date() })
      .where(eq(locations.id, id))
      .returning();
    return location;
  }

  async deleteLocation(id: number): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }

  // Role Master implementations
  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(roleData).returning();
    return role;
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role> {
    const [role] = await db.update(roles)
      .set({ ...roleData, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return role;
  }

  async deleteRole(id: number): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
  }

  // Approval Matrix implementations
  async getAllApprovalMatrix(): Promise<ApprovalMatrix[]> {
    return await db.select().from(approvalMatrix);
  }

  async createApprovalMatrix(matrixData: InsertApprovalMatrix): Promise<ApprovalMatrix> {
    const [matrix] = await db.insert(approvalMatrix).values(matrixData).returning();
    return matrix;
  }

  async updateApprovalMatrix(id: number, matrixData: Partial<InsertApprovalMatrix>): Promise<ApprovalMatrix> {
    const [matrix] = await db.update(approvalMatrix)
      .set({ ...matrixData, updatedAt: new Date() })
      .where(eq(approvalMatrix.id, id))
      .returning();
    return matrix;
  }

  async deleteApprovalMatrix(id: number): Promise<void> {
    await db.delete(approvalMatrix).where(eq(approvalMatrix.id, id));
  }

  // Escalation Matrix implementations
  async getAllEscalationMatrix(): Promise<EscalationMatrix[]> {
    return await db.select().from(escalationMatrix);
  }

  async createEscalationMatrix(matrixData: InsertEscalationMatrix): Promise<EscalationMatrix> {
    const [matrix] = await db.insert(escalationMatrix).values(matrixData).returning();
    return matrix;
  }

  async updateEscalationMatrix(id: number, matrixData: Partial<InsertEscalationMatrix>): Promise<EscalationMatrix> {
    const [matrix] = await db.update(escalationMatrix)
      .set({ ...matrixData, updatedAt: new Date() })
      .where(eq(escalationMatrix.id, id))
      .returning();
    return matrix;
  }

  async deleteEscalationMatrix(id: number): Promise<void> {
    await db.delete(escalationMatrix).where(eq(escalationMatrix.id, id));
  }

  // Inventory Master implementations
  async getAllInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory);
  }

  async createInventory(itemData: InsertInventory): Promise<Inventory> {
    const [item] = await db.insert(inventory).values(itemData).returning();
    return item;
  }

  async updateInventory(id: number, itemData: Partial<InsertInventory>): Promise<Inventory> {
    const [item] = await db.update(inventory)
      .set({ ...itemData, updatedAt: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    return item;
  }

  async deleteInventory(id: number): Promise<void> {
    await db.delete(inventory).where(eq(inventory.id, id));
  }

  // Vendor Master implementations
  async getAllVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors);
  }

  async createVendor(vendorData: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(vendorData).returning();
    return vendor;
  }

  async updateVendor(id: number, vendorData: Partial<InsertVendor>): Promise<Vendor> {
    const [vendor] = await db.update(vendors)
      .set({ ...vendorData, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }

  async deleteVendor(id: number): Promise<void> {
    await db.delete(vendors).where(eq(vendors.id, id));
  }
}

export const storage = new DatabaseStorage();
