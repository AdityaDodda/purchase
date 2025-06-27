import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertPurchaseRequestSchema, insertLineItemSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendPasswordResetEmail, sendPurchaseRequestToApprovers } from "./email";

// Configure multer for file uploads
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, and images are allowed.'));
    }
  }
});

// Helper to parse dd-mm-yyyy to Date
function parseDDMMYYYY(dateStr) {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("-");
  if (!day || !month || !year) return null;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function registerRoutes(app: Express): Server {
  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  // Helper function to calculate total cost from line items
  const calculateTotalCost = (items: any[]) => {
    return items.reduce((sum, item) => {
      const itemTotal = (item.requiredQuantity || 0) * parseFloat(item.estimatedCost.toString());
      return sum + itemTotal;
    }, 0);
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { employeeNumber, password } = z.object({
        employeeNumber: z.string(),
        password: z.string(),
      }).parse(req.body);

      const user = await storage.getUserByEmployeeNumber(employeeNumber);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store user in session
      req.session.user = {
        id: user.id,
        employeeNumber: user.employeeNumber,
        fullName: user.fullName,
        email: user.email,
        department: user.department,
        location: user.location,
        role: user.role,
      };

      res.json({ user: req.session.user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmployeeNumber(userData.employeeNumber);
      if (existingUser) {
        return res.status(400).json({ message: "Employee number already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Store user in session
      req.session.user = {
        id: newUser.id,
        employeeNumber: newUser.employeeNumber,
        fullName: newUser.fullName,
        email: newUser.email,
        department: newUser.department,
        location: newUser.location,
        role: newUser.role,
      };

      res.json({ user: req.session.user });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Forgot Password
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      const user = await storage.getUserByEmail(email);

      if (user) {
        const resetLink = `http://${req.headers.host}/reset-password?email=${encodeURIComponent(email)}`;
        await sendPasswordResetEmail(user.email, resetLink);
      }
      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reset Password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }).parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid email or reset link." });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUserPassword(user.id, hashedPassword);
      res.json({ message: "Password has been reset successfully." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const safeUser = {
        id: user.id,
        employeeNumber: user.employeeNumber,
        fullName: user.fullName,
        email: user.email,
        department: user.department,
        location: user.location,
        role: user.role,
      };
      res.json(safeUser);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Purchase Request routes
  app.post("/api/purchase-requests", requireAuth, async (req: any, res) => {
    try {
      console.log("Creating purchase request with data:", JSON.stringify(req.body, null, 2));
      console.log("User session:", req.session.user);
      
      // Generate requisition number first
      const requisitionNumber = await storage.generateRequisitionNumber(req.body.department);
      console.log("Generated requisition number:", requisitionNumber);
      
      // Find the first approver for this department/location
      const workflow = await storage.getApprovalWorkflow(req.body.department, req.body.location);
      const firstApprover = workflow.find(wf => wf.approvalLevel === 1);
      if (!firstApprover) {
        return res.status(400).json({ message: "No approver configured for this department/location." });
      }
      
      // Transform and prepare request data
      const requestData = {
        ...req.body,
        requesterId: req.session.user.id,
        requestDate: new Date(req.body.requestDate),
        totalEstimatedCost: req.body.totalEstimatedCost || "0",
        requisitionNumber, // Add the generated requisition number
        currentApproverId: firstApprover.approverId,
        currentApproverEmployeeNumber: firstApprover.approverEmployeeNumber,
        currentApprovalLevel: 1,
        status: 'pending', // Ensure status is set to pending
      };
      
      console.log("Transformed request data:", JSON.stringify(requestData, null, 2));

      // Validate with schema
      const validatedData = insertPurchaseRequestSchema.parse(requestData);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      
      const newRequest = await storage.createPurchaseRequest(validatedData);
      console.log("Created request:", JSON.stringify(newRequest, null, 2));

      // Create notification for the approver
      await storage.createNotification({
        userId: firstApprover.approverId,
        purchaseRequestId: newRequest.id,
        title: "Purchase Request Approval Needed",
        message: `A new purchase request ${requisitionNumber} requires your approval.`,
        type: "info",
      });

      // Create notification for requester
      await storage.createNotification({
        userId: req.session.user.id,
        purchaseRequestId: newRequest.id,
        title: "Purchase Request Submitted",
        message: `Your purchase request ${requisitionNumber} has been submitted successfully.`,
        type: "success",
      });

      // After creating the new request
      const approvers = await storage.getApproversByDepartmentLocation(validatedData.department, validatedData.location);
      const approverEmails = approvers.map(a => a.email).filter(Boolean);
      if (approverEmails.length > 0) {
        const approvalLink = `http://${req.headers.host}/purchase-requests/${newRequest.id}`;
        await sendPurchaseRequestToApprovers(
          approverEmails,
          requisitionNumber,
          validatedData.department,
          validatedData.location,
          approvalLink
        );
      }

      res.json(newRequest);
    } catch (error: any) {
      console.error("Create purchase request error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Internal server error", details: error.message });
    }
  });

  app.get("/api/purchase-requests/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getPurchaseRequestWithDetails(id);
      
      if (!request) {
        return res.status(404).json({ message: "Purchase request not found" });
      }

      // Allow requester, admin, or current approver to view
      if (
        request.requesterId !== req.session.user.id &&
        req.session.user.role !== 'admin' &&
        request.currentApproverId !== req.session.user.id
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(request);
    } catch (error) {
      console.error("Get purchase request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/purchase-requests", requireAuth, async (req: any, res) => {
    try {
      const filters = req.query;
      let requests;

      // If currentApproverId is provided, filter by it
      if (filters.currentApproverId) {
        requests = await storage.getAllPurchaseRequests({
          ...filters,
          currentApproverId: parseInt(filters.currentApproverId, 10),
        });
      } else if (req.session.user.role === 'admin') {
        requests = await storage.getAllPurchaseRequests(filters);
      } else {
        requests = await storage.getPurchaseRequestsByUser(req.session.user.id, filters);
      }

      // Apply client-side filtering for "all" values
      if (requests && Array.isArray(requests)) {
        let filteredRequests = requests;

        if (filters.status && filters.status !== 'all') {
          filteredRequests = filteredRequests.filter(req => req.status === filters.status);
        }
        if (filters.department && filters.department !== 'all') {
          filteredRequests = filteredRequests.filter(req => req.department === filters.department);
        }
        if (filters.location && filters.location !== 'all') {
          filteredRequests = filteredRequests.filter(req => req.location && req.location.includes(filters.location));
        }
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredRequests = filteredRequests.filter(req => 
            req.title?.toLowerCase().includes(searchTerm) ||
            req.requisitionNumber?.toLowerCase().includes(searchTerm) ||
            req.businessJustificationDetails?.toLowerCase().includes(searchTerm)
          );
        }
        requests = filteredRequests;
      }

      res.json(requests);
    } catch (error) {
      console.error("Get purchase requests error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/purchase-requests/:id/details", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getPurchaseRequestWithDetails(id);
      
      if (!request) {
        return res.status(404).json({ message: "Purchase request not found" });
      }

      // Allow all authenticated users to view details for reporting
      // (previously restricted to requester, admin, or current approver)

      // Fetch line items
      const lineItems = await storage.getLineItemsByRequest(id);
      
      res.json({
        ...request,
        lineItems
      });
    } catch (error) {
      console.error("Get purchase request details error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/purchase-requests/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getPurchaseRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Purchase request not found" });
      }
      // Only requester can edit a returned request
      if (request.status !== 'returned' || req.session.user.id !== request.requesterId) {
        return res.status(403).json({ message: "Only the requester can edit a returned request." });
      }
      // Find the first approver for this department/location
      const workflow = await storage.getApprovalWorkflow(request.department, request.location);
      const firstApprover = workflow.find(wf => wf.approvalLevel === 1);
      if (!firstApprover) {
        return res.status(400).json({ message: "No approver configured for this department/location." });
      }
      // On resubmit, set status to 'pending', assign currentApproverId and currentApprovalLevel
      const updatedRequest = await storage.updatePurchaseRequest(id, {
        ...req.body,
        status: 'pending',
        currentApproverId: firstApprover.approverId,
        currentApproverEmployeeNumber: firstApprover.approverEmployeeNumber,
        currentApprovalLevel: 1,
      });
      // Create notification for the new approver
      await storage.createNotification({
        userId: firstApprover.approverId,
        purchaseRequestId: id,
        title: "Purchase Request Approval Needed",
        message: `A returned purchase request ${request.requisitionNumber} has been resubmitted and requires your approval.`,
        type: "info",
      });
      res.json(updatedRequest);
    } catch (error) {
      console.error("Update purchase request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Line Items routes
  app.post("/api/purchase-requests/:id/line-items", requireAuth, async (req: any, res) => {
    try {
      const purchaseRequestId = parseInt(req.params.id);
      console.log("Creating line item for purchase request:", purchaseRequestId);
      console.log("Line item data received:", JSON.stringify(req.body, null, 2));
      
      // Transform data to match schema expectations
      const lineItemData = {
        ...req.body,
        purchaseRequestId,
        requiredQuantity: typeof req.body.requiredQuantity === 'string' ? parseInt(req.body.requiredQuantity) : req.body.requiredQuantity,
        estimatedCost: typeof req.body.estimatedCost === 'number' ? req.body.estimatedCost.toString() : req.body.estimatedCost,
        requiredByDate: req.body.requiredByDate ? parseDDMMYYYY(req.body.requiredByDate) : new Date(),
        stockAvailable: req.body.stockAvailable ? 
          (typeof req.body.stockAvailable === 'string' ? parseInt(req.body.stockAvailable) : req.body.stockAvailable) : 0,
      };
      
      console.log("Transformed line item data:", JSON.stringify(lineItemData, null, 2));

      const validatedData = insertLineItemSchema.parse(lineItemData);
      console.log("Validated line item data:", JSON.stringify(validatedData, null, 2));
      
      const lineItem = await storage.createLineItem(validatedData);
      console.log("Created line item:", JSON.stringify(lineItem, null, 2));
      
      // Update total estimated cost
      const allItems = await storage.getLineItemsByRequest(purchaseRequestId);
      const totalCost = calculateTotalCost(allItems);
      
      await storage.updatePurchaseRequest(purchaseRequestId, {
        totalEstimatedCost: totalCost.toString(),
      });

      res.json(lineItem);
    } catch (error: any) {
      console.error("Create line item error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Internal server error", details: error.message });
    }
  });

  app.get("/api/purchase-requests/:id/line-items", requireAuth, async (req, res) => {
    try {
      const purchaseRequestId = parseInt(req.params.id);
      const lineItems = await storage.getLineItemsByRequest(purchaseRequestId);
      res.json(lineItems);
    } catch (error) {
      console.error("Get line items error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/purchase-requests/:requestId/line-items/:itemId", requireAuth, async (req, res) => {
    try {
      const purchaseRequestId = parseInt(req.params.requestId);
      const lineItemId = parseInt(req.params.itemId);
      
      // Delete the line item
      await storage.deleteLineItem(lineItemId);
      
      // Recalculate total estimated cost
      const allItems = await storage.getLineItemsByRequest(purchaseRequestId);
      const totalCost = calculateTotalCost(allItems);
      
      await storage.updatePurchaseRequest(purchaseRequestId, {
        totalEstimatedCost: totalCost.toString(),
      });

      res.json({ message: "Line item deleted successfully" });
    } catch (error) {
      console.error("Delete line item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/purchase-requests/:requestId/line-items/:itemId", requireAuth, async (req, res) => {
    try {
      const purchaseRequestId = parseInt(req.params.requestId);
      const lineItemId = parseInt(req.params.itemId);
      
      // Transform data to match schema expectations
      const lineItemData = {
        ...req.body,
        requiredQuantity: typeof req.body.requiredQuantity === 'string' ? parseInt(req.body.requiredQuantity) : req.body.requiredQuantity,
        estimatedCost: typeof req.body.estimatedCost === 'number' ? req.body.estimatedCost.toString() : req.body.estimatedCost,
        requiredByDate: req.body.requiredByDate ? parseDDMMYYYY(req.body.requiredByDate) : new Date(),
        stockAvailable: req.body.stockAvailable ? 
          (typeof req.body.stockAvailable === 'string' ? parseInt(req.body.stockAvailable) : req.body.stockAvailable) : 0,
      };

      // Update the line item
      const updatedLineItem = await storage.updateLineItem(lineItemId, lineItemData);
      
      // Recalculate total estimated cost
      const allItems = await storage.getLineItemsByRequest(purchaseRequestId);
      const totalCost = calculateTotalCost(allItems);
      
      await storage.updatePurchaseRequest(purchaseRequestId, {
        totalEstimatedCost: totalCost.toString(),
      });

      res.json(updatedLineItem);
    } catch (error) {
      console.error("Update line item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Attachments routes
  app.post("/api/purchase-requests/:id/attachments", requireAuth, upload.array('files', 10), async (req: any, res) => {
    try {
      const purchaseRequestId = parseInt(req.params.id);
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const attachments = [];
      for (const file of files) {
        const attachment = await storage.createAttachment({
          purchaseRequestId,
          fileName: file.filename,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          filePath: file.path,
        });
        attachments.push(attachment);
      }

      res.json(attachments);
    } catch (error) {
      console.error("Upload attachments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/purchase-requests/:id/attachments", requireAuth, async (req, res) => {
    try {
      const purchaseRequestId = parseInt(req.params.id);
      const attachments = await storage.getAttachmentsByRequest(purchaseRequestId);
      res.json(attachments);
    } catch (error) {
      console.error("Get attachments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Approval routes
  app.post("/api/purchase-requests/:id/approve", requireAuth, requireRole(['approver', 'admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { comments } = req.body;
      
      const request = await storage.getPurchaseRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Purchase request not found" });
      }
      if (request.status === 'returned') {
        return res.status(400).json({ message: "Cannot approve a returned request. Please wait for the requester to resubmit." });
      }
      // Only the current approver can approve
      if (request.currentApproverId !== req.session.user.id) {
        return res.status(403).json({ message: "You are not authorized to approve this request at this stage." });
      }
      // Log approval action
      const approver = await storage.getUser(req.session.user.id);
      console.log("Logging approval history:", {
        purchaseRequestId: id,
        approverId: req.session.user.id,
        approverEmployeeNumber: approver.employeeNumber,
        action: 'approve',
        comments,
        approvalLevel: request.currentApprovalLevel,
      });
      await storage.createApprovalHistory({
        purchaseRequestId: id,
        approverId: req.session.user.id,
        approverEmployeeNumber: approver.employeeNumber,
        action: 'approve',
        comments,
        approvalLevel: request.currentApprovalLevel,
      });

      // Get approval workflow for this request
      const workflow = await storage.getApprovalWorkflow(request.department, request.location);
      const nextLevel = request.currentApprovalLevel + 1;
      const nextApprover = workflow.find(wf => wf.approvalLevel === nextLevel);

      if (nextApprover) {
        // Move to next level
        await storage.updatePurchaseRequest(id, {
          status: 'pending',
          currentApproverId: nextApprover.approverId,
          currentApproverEmployeeNumber: nextApprover.approverEmployeeNumber,
          currentApprovalLevel: nextLevel,
        });
        // Notify next approver
        await storage.createNotification({
          userId: nextApprover.approverId,
          purchaseRequestId: id,
          title: "Purchase Request Approval Needed",
          message: `A purchase request ${request.requisitionNumber} requires your approval (Level ${nextLevel}).`,
          type: "info",
        });
        res.json({ message: `Request moved to level ${nextLevel} for next approval.` });
      } else {
        // Final approval
        await storage.updatePurchaseRequest(id, {
          status: 'approved',
          currentApproverId: null,
          currentApproverEmployeeNumber: null,
          currentApprovalLevel: request.currentApprovalLevel,
        });
        // Notify requester
        await storage.createNotification({
          userId: request.requesterId,
          purchaseRequestId: id,
          title: "Purchase Request Approved",
          message: `Your purchase request ${request.requisitionNumber} has been fully approved!`,
          type: "success",
        });
        res.json({ message: "Request fully approved." });
      }
    } catch (error) {
      console.error("Approve request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/purchase-requests/:id/reject", requireAuth, requireRole(['approver', 'admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { comments } = req.body;
      
      const request = await storage.getPurchaseRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Purchase request not found" });
      }

      // Log rejection
      const approver = await storage.getUser(req.session.user.id);
      console.log("Logging approval history:", {
        purchaseRequestId: id,
        approverId: req.session.user.id,
        approverEmployeeNumber: approver.employeeNumber,
        action: 'reject',
        comments,
        approvalLevel: request.currentApprovalLevel,
      });
      await storage.createApprovalHistory({
        purchaseRequestId: id,
        approverId: req.session.user.id,
        approverEmployeeNumber: approver.employeeNumber,
        action: 'reject',
        comments,
        approvalLevel: request.currentApprovalLevel,
      });

      // Update request status
      await storage.updatePurchaseRequest(id, {
        status: 'rejected',
        currentApproverId: null,
        currentApproverEmployeeNumber: null,
      });

      // Notify requester
      await storage.createNotification({
        userId: request.requesterId,
        purchaseRequestId: id,
        title: "Purchase Request Rejected",
        message: `Your purchase request ${request.requisitionNumber} has been rejected. ${comments}`,
        type: "error",
      });

      res.json({ message: "Request rejected successfully" });
    } catch (error) {
      console.error("Reject request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Return request route
  app.post("/api/purchase-requests/:id/return", requireAuth, requireRole(['approver', 'admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { comments } = req.body;
      
      const request = await storage.getPurchaseRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Purchase request not found" });
      }

      // Log return
      const approver = await storage.getUser(req.session.user.id);
      console.log("Logging approval history:", {
        purchaseRequestId: id,
        approverId: req.session.user.id,
        approverEmployeeNumber: approver.employeeNumber,
        action: 'return',
        comments,
        approvalLevel: request.currentApprovalLevel,
      });
      await storage.createApprovalHistory({
        purchaseRequestId: id,
        approverId: req.session.user.id,
        approverEmployeeNumber: approver.employeeNumber,
        action: 'return',
        comments,
        approvalLevel: request.currentApprovalLevel,
      });

      // Update request status - return to requester
      await storage.updatePurchaseRequest(id, {
        status: 'returned',
        currentApproverId: null,
        currentApproverEmployeeNumber: null,
        currentApprovalLevel: 1,
      });

      // Notify requester
      await storage.createNotification({
        userId: request.requesterId,
        purchaseRequestId: id,
        title: "Purchase Request Returned",
        message: `Your purchase request ${request.requisitionNumber} has been returned for revision. Please review the comments and resubmit.`,
        type: "warning",
      });

      res.json({ message: "Request returned successfully" });
    } catch (error) {
      console.error("Return request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Statistics routes
  app.get("/api/dashboard/stats", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let stats;
      if (user.role === "admin") {
        // Admin sees all requests
        stats = await storage.getPurchaseRequestStats();
      } else {
        // Regular users see only their own requests
        stats = await storage.getPurchaseRequestStatsByUser(req.session.user.id);
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", requireAuth, async (req: any, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.session.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reports API - Get purchase requests for reports with advanced filtering
  app.get('/api/reports/purchase-requests', requireAuth, async (req: any, res) => {
    try {
      const filters = {
        ...req.query,
        includeRequester: true,
        includeLineItems: false
      };
      let requests;
      if (req.session.user.role === 'admin') {
        requests = await storage.getAllPurchaseRequests(filters);
      } else {
        requests = await storage.getPurchaseRequestsByUser(req.session.user.id, filters);
      }
      res.json(requests);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      res.status(500).json({ message: 'Failed to fetch reports data' });
    }
  });

  // Admin Masters API - Get all users for admin masters
  app.get('/api/admin/users', requireAuth, async (req: any, res) => {
    try {
      const userRole = req.session.user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Admin Masters API - Generic endpoint for master data
  app.get('/api/admin/masters/:type', requireAuth, async (req: any, res) => {
    try {
      const userRole = req.session.user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { type } = req.params;
      let data = [];

      switch (type) {
        case 'users':
          data = await storage.getAllUsers();
          break;
        case 'entities':
          data = await storage.getAllEntities();
          break;
        case 'departments':
          data = await storage.getAllDepartments();
          break;
        case 'locations':
          data = await storage.getAllLocations();
          break;
        case 'roles':
          data = await storage.getAllRoles();
          break;
        case 'approval-matrix':
          data = await storage.getAllApprovalMatrix();
          break;
        case 'escalation-matrix':
          data = await storage.getAllEscalationMatrix();
          break;
        case 'inventory':
          data = await storage.getAllInventory();
          break;
        case 'vendors':
          data = await storage.getAllVendors();
          break;
        default:
          return res.status(400).json({ message: 'Invalid master type' });
      }

      res.json(data);
    } catch (error) {
      console.error(`Error fetching ${req.params.type} master data:`, error);
      res.status(500).json({ message: `Failed to fetch ${req.params.type} data` });
    }
  });

  // Admin Masters API - Create master data
  app.post('/api/admin/masters/:type', requireAuth, async (req: any, res) => {
    try {
      const userRole = req.session.user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { type } = req.params;
      let result;

      switch (type) {
        case 'users':
          result = await storage.createUser(req.body);
          break;
        case 'entities':
          result = await storage.createEntity(req.body);
          break;
        case 'departments':
          result = await storage.createDepartment(req.body);
          break;
        case 'locations':
          result = await storage.createLocation(req.body);
          break;
        case 'roles':
          result = await storage.createRole(req.body);
          break;
        case 'approval-matrix':
          result = await storage.createApprovalMatrix(req.body);
          break;
        case 'escalation-matrix':
          result = await storage.createEscalationMatrix(req.body);
          break;
        case 'inventory':
          result = await storage.createInventory(req.body);
          break;
        case 'vendors':
          result = await storage.createVendor(req.body);
          break;
        default:
          return res.status(400).json({ message: 'Invalid master type' });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error(`Error creating ${req.params.type}:`, error);
      res.status(500).json({ message: `Failed to create ${req.params.type}` });
    }
  });

  // Admin Masters API - Update master data
  app.put('/api/admin/masters/:type/:id', requireAuth, async (req: any, res) => {
    try {
      const userRole = req.session.user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { type, id } = req.params;
      let result;

      switch (type) {
        case 'users':
          result = await storage.updateUser(parseInt(id), req.body);
          break;
        case 'entities':
          result = await storage.updateEntity(parseInt(id), req.body);
          break;
        case 'departments':
          result = await storage.updateDepartment(parseInt(id), req.body);
          break;
        case 'locations':
          result = await storage.updateLocation(parseInt(id), req.body);
          break;
        case 'roles':
          result = await storage.updateRole(parseInt(id), req.body);
          break;
        case 'approval-matrix':
          result = await storage.updateApprovalMatrix(parseInt(id), req.body);
          break;
        case 'escalation-matrix':
          result = await storage.updateEscalationMatrix(parseInt(id), req.body);
          break;
        case 'inventory':
          result = await storage.updateInventory(parseInt(id), req.body);
          break;
        case 'vendors':
          result = await storage.updateVendor(parseInt(id), req.body);
          break;
        default:
          return res.status(400).json({ message: 'Invalid master type' });
      }

      res.json(result);
    } catch (error) {
      console.error(`Error updating ${req.params.type}:`, error);
      res.status(500).json({ message: `Failed to update ${req.params.type}` });
    }
  });

  // Admin Masters API - Delete master data
  app.delete('/api/admin/masters/:type/:id', requireAuth, async (req: any, res) => {
    try {
      const userRole = req.session.user?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { type, id } = req.params;

      switch (type) {
        case 'users':
          await storage.deleteUser(parseInt(id));
          break;
        case 'entities':
          await storage.deleteEntity(parseInt(id));
          break;
        case 'departments':
          await storage.deleteDepartment(parseInt(id));
          break;
        case 'locations':
          await storage.deleteLocation(parseInt(id));
          break;
        case 'roles':
          await storage.deleteRole(parseInt(id));
          break;
        case 'approval-matrix':
          await storage.deleteApprovalMatrix(parseInt(id));
          break;
        case 'escalation-matrix':
          await storage.deleteEscalationMatrix(parseInt(id));
          break;
        case 'inventory':
          await storage.deleteInventory(parseInt(id));
          break;
        case 'vendors':
          await storage.deleteVendor(parseInt(id));
          break;
        default:
          return res.status(400).json({ message: 'Invalid master type' });
      }

      res.json({ message: 'Record deleted successfully' });
    } catch (error) {
      console.error(`Error deleting ${req.params.type}:`, error);
      res.status(500).json({ message: `Failed to delete ${req.params.type}` });
    }
  });

  // Inventory API for line items dropdown
  app.get('/api/inventory', requireAuth, async (req: any, res) => {
    try {
      const inventory = await storage.getAllInventory();
      res.json(inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ message: 'Failed to fetch inventory' });
    }
  });

  // API to get approval workflow for a department/location
  app.get("/api/approval-workflow", requireAuth, async (req, res) => {
    try {
      const { department, location } = req.query;
      if (!department || !location) {
        return res.status(400).json({ message: "Department and location are required" });
      }
      const workflow = await storage.getApprovalWorkflow(String(department), String(location));
      res.json(workflow);
    } catch (error) {
      console.error("Get approval workflow error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // API to get approval history for a request
  app.get("/api/approval-history/:requestId", requireAuth, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const history = await storage.getApprovalHistoryByRequest(requestId);
      res.json(history);
    } catch (error) {
      console.error("Get approval history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
