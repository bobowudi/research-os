/**
 * Global Type Definitions for ResearchOS Frontend
 */

declare global {
  // Common API Response structure
  interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
  }

  // Common Issue types
  type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled';
  type IssuePriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

  interface Issue {
    id: string;
    title: string;
    description?: string;
    status: IssueStatus;
    priority: IssuePriority;
    assigneeId?: string;
    creatorId: string;
    domain?: string;
    createdAt: string;
    updatedAt: string;
  }

  // User type
  interface User {
    id: string;
    email: string;
    username: string;
    avatar?: string;
    role: 'admin' | 'user';
  }
}

export {};
