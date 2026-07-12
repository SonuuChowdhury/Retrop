// ============================================================================
// REQUEST BODY VALIDATION MIDDLEWARE (using Zod)
// ============================================================================

import { z } from 'zod';
import { logger } from '../utils/logger.js';

// Middleware generator
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(`Validation failed for ${req.method} ${req.path}:`, error.issues);
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload',
        errors: (error.issues || error.errors || []).map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    next(error);
  }
};

// Loose UUID pattern to support both RFC 4122 compliant UUIDs and mock/seed UUIDs (like 10000000-1111-1111-1111-111111111111) in local development.
const looseUuid = (msg = 'Invalid UUID format') => z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, msg);

// ============================================================================
// OWNER & INVENTORY SCHEMAS
// ============================================================================

export const schemas = {
  // Auth login
  login: z.object({
    loginIdentifier: z.string().min(1, 'Email or mobile number is required'),
    password: z.string().min(1, 'Password is required'),
  }),

  // Auth password reset
  resetPassword: z.object({
    ownerId: looseUuid('Invalid ownerId format'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
  }),

  // Create Manager
  createManager: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    mobile: z.string().regex(/^[0-9]{10,15}$/, 'Mobile must contain only digits (10 to 15 digits)'),
    password: z.string().min(5, 'Password must be at least 5 characters long'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    role: z.enum(['manager', 'owner']).optional(),
  }),

  // Reset Manager Password
  resetManagerPassword: z.object({
    password: z.string().min(5, 'Password must be at least 5 characters long'),
  }),

  // Create/Update Vendor
  vendor: z.object({
    name: z.string().min(2, 'Vendor name must be at least 2 characters'),
    mobile: z.string().optional().nullable(),
    email: z.string().email('Invalid email format').optional().nullable().or(z.literal('')),
    gstin: z.string().max(15, 'GSTIN must be at most 15 characters').optional().nullable(),
    address: z.string().optional().nullable(),
    paymentTerms: z.string().optional().nullable(),
  }),

  // Create/Update Inventory Item
  inventoryItem: z.object({
    name: z.string().min(2, 'Item name must be at least 2 characters'),
    unit: z.enum(['kg', 'litre', 'piece', 'packet', 'dozen']),
    category: z.string().optional(),
    reorderLevel: z.number().nonnegative('Reorder level cannot be negative').optional(),
    currentStock: z.number().optional(),
    costPerUnit: z.number().nonnegative('Cost per unit cannot be negative').optional(),
  }),

  // Recipe (BOM) Config
  recipe: z.object({
    dishId: looseUuid('Invalid dishId format'),
    yieldQuantity: z.number().positive('Yield quantity must be positive').optional(),
    ingredients: z.array(
      z.object({
        itemId: looseUuid('Invalid itemId format'),
        itemName: z.string(),
        quantity: z.number().positive('Quantity must be greater than zero'),
        unit: z.string(),
      })
    ).min(1, 'Recipe must have at least one ingredient'),
  }),

  // Purchase Entry Log
  purchase: z.object({
    vendorId: looseUuid('Invalid vendorId format').nullable().optional(),
    invoiceNo: z.string().optional().nullable(),
    purchaseDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
    paymentStatus: z.enum(['paid', 'unpaid', 'partial']),
    paymentMethod: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    totalAmount: z.number().positive('Total amount must be greater than zero'),
    items: z.array(
      z.object({
        itemId: looseUuid('Invalid itemId format'),
        quantity: z.number().positive('Quantity must be greater than zero'),
        unitPrice: z.number().nonnegative('Unit price cannot be negative'),
        totalPrice: z.number().nonnegative('Total price cannot be negative'),
      })
    ).min(1, 'Purchase invoice must have at least one item'),
  }),

  // Create Staff
  createStaff: z.object({
    type: z.enum(['manager', 'waiter', 'chef', 'other']),
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    mobile: z.string().regex(/^[0-9]{10,15}$/, 'Mobile must contain only digits (10 to 15 digits)'),
    password: z.string().min(5, 'Password must be at least 5 characters long'),
    role: z.string().optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
  }),

  // Reset Staff Password
  resetStaffPassword: z.object({
    password: z.string().min(5, 'Password must be at least 5 characters long'),
  }),

  // Log Expense
  expense: z.object({
    amount: z.number().positive('Amount must be positive'),
    category: z.string().min(1, 'Category is required'),
    description: z.string().optional().nullable(),
    paymentMode: z.string().optional(),
    expenseDate: z.string().optional().nullable(),
  }),

  // Day Close
  dayClose: z.object({
    openingCash: z.number().nonnegative('Opening cash cannot be negative'),
    actualCash: z.number().nonnegative('Actual cash cannot be negative'),
    notes: z.string().optional().nullable(),
    date: z.string().optional().nullable(),
  }),

  // Customer Feedback
  customerFeedback: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional().nullable(),
  }),
};
