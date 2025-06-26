# Purchase Request Management System - replit.md

## Overview

This is a full-stack web application for managing purchase requests in a corporate environment, specifically built for Kandhari Global Beverages. The system provides a comprehensive workflow for creating, reviewing, and approving purchase requests with user authentication, role-based access control, and file management capabilities.

## System Architecture

The application follows a modern monorepo structure with separate client and server codebases:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom brand colors for Kandhari Global Beverages
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Express sessions with connect-pg-simple for session storage
- **File Handling**: Multer for file uploads with local storage
- **Password Security**: bcrypt for password hashing

## Key Components

### Database Schema
The system uses a relational database with the following core entities:
- **Users**: Employee information with role-based permissions (requester, approver, admin)
- **Purchase Requests**: Main request entity with workflow status tracking
- **Line Items**: Individual items within purchase requests (referenced but not fully implemented)
- **Sessions**: Express session management for authentication

### Authentication System
- Session-based authentication with secure HTTP-only cookies
- Role-based access control (requester, approver, admin)
- Password hashing with bcrypt
- Automatic session cleanup and expiration

### File Upload System
- Multer-based file handling with type validation
- Support for PDF, Word, Excel, and image files
- 10MB file size limit
- Secure filename generation to prevent conflicts

### UI Components
- Comprehensive component library based on Radix UI primitives
- Custom status badges for request workflow states
- Progress stepper for multi-step form navigation
- File upload component with drag-and-drop support
- Responsive design with mobile support

## Data Flow

1. **User Registration/Login**: Users authenticate through session-based login
2. **Request Creation**: Multi-step form process for creating purchase requests
3. **Request Submission**: Automatic requisition number generation and status tracking
4. **Approval Workflow**: Role-based approval process with status updates
5. **File Management**: Secure file upload and storage for supporting documents

## External Dependencies

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/**: Comprehensive UI component primitives
- **react-hook-form**: Form state management and validation
- **zod**: Runtime type validation
- **wouter**: Lightweight React router
- **tailwindcss**: Utility-first CSS framework

### Backend Dependencies
- **@neondatabase/serverless**: PostgreSQL database adapter for Neon
- **drizzle-orm**: Type-safe SQL ORM
- **express-session**: Session management middleware
- **multer**: File upload handling
- **bcrypt**: Password hashing
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

The application is configured for deployment on Replit with:
- **Development**: `npm run dev` - runs Express server with Vite HMR
- **Production Build**: `npm run build` - builds client assets and server bundle
- **Production Start**: `npm run start` - runs compiled production server
- **Database Management**: Drizzle Kit for schema management and migrations

### Environment Configuration
- PostgreSQL database connection via `DATABASE_URL`
- Session secret for authentication security
- File upload directory management
- Development vs production environment detection

## Test User Credentials

For testing the system, use these login credentials:

**Admin User (Full Access):**
- Employee Number: `EMP001`
- Password: `password`
- Role: Admin

**Approver Users:**
- Employee Number: `EMP002` / Password: `password` (Quality Control)
- Employee Number: `EMP004` / Password: `password` (Finance)

**Regular Users:**
- Employee Number: `EMP003` / Password: `password` (Sales & Marketing)
- Employee Number: `EMP005` / Password: `password` (IT)

## User Preferences

```
Preferred communication style: Simple, everyday language.
```