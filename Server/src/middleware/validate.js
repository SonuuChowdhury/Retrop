// ============================================================================
// REQUEST BODY VALIDATION MIDDLEWARE (using Zod)
// ============================================================================

import { z } from 'zod';

// Middleware generator
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload',
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    next(error);
  }
};

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
    ownerId: z.string().uuid('Invalid ownerId format'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
  }),

  // Create Manager
  createManager: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    mobile: z.string().min(10, 'Mobile must be at least 10 digits').max(15, 'Mobile too long'),
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
    dishId: z.string().uuid('Invalid dishId format'),
    yieldQuantity: z.number().positive('Yield quantity must be positive').optional(),
    ingredients: z.array(
      z.object({
        itemId: z.string().uuid('Invalid itemId format'),
        itemName: z.string(),
        quantity: z.number().positive('Quantity must be greater than zero'),
        unit: z.string(),
      })
    ).min(1, 'Recipe must have at least one ingredient'),
  }),

  // Purchase Entry Log
  purchase: z.object({
    vendorId: z.string().uuid('Invalid vendorId format').nullable().optional(),
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
        itemId: z.string().uuid('Invalid itemId format'),
        quantity: z.number().positive('Quantity must be greater than zero'),
        unitPrice: z.number().nonnegative('Unit price cannot be negative'),
        totalPrice: z.number().nonnegative('Total price cannot be negative'),
      })
    ).min(1, 'Purchase invoice must have at least one item'),
  }),
};
