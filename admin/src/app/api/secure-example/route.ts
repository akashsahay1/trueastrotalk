import { NextResponse } from 'next/server';
import { withSecurity, SecurityPresets, AuthenticatedNextRequest } from '@/lib/api-security';
import { Validator } from '@/lib/validation';
import DatabaseService from '@/lib/database';
import { ObjectId } from 'mongodb';

/**
 * Example of properly secured API endpoint
 * This demonstrates how to use the security middleware
 */

// GET - Public endpoint with light rate limiting  
export const GET = withSecurity(async (request: AuthenticatedNextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    // This endpoint is rate limited but doesn't require authentication
    return NextResponse.json({
      success: true,
      message: `Public search for: ${query}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Public endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred',
    }, { status: 500 });
  }
}, SecurityPresets.public);

// POST - Admin-only endpoint with full security
export const POST = withSecurity(async (request: AuthenticatedNextRequest) => {
  try {
    // The security middleware has already:
    // 1. Applied rate limiting
    // 2. Checked authentication 
    // 3. Validated admin role
    // 4. Checked CSRF token
    // 5. Sanitized input
    
    const body = await request.json();
    const { name, description, category } = body;
    
    // Additional input validation
    const validation = Validator.validate([
      {
        field: 'name',
        value: name,
        rules: ['required', 'minLength:3', 'maxLength:100']
      },
      {
        field: 'description', 
        value: description,
        rules: ['required', 'minLength:10', 'maxLength:1000']
      },
      {
        field: 'category',
        value: category,
        rules: ['required', 'minLength:2', 'maxLength:50']
      }
    ]);
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: validation.errors,
      }, { status: 400 });
    }
    
    // Get authenticated user (added by security middleware)
    const authenticatedUser = request.user;
    
    // Perform secure database operation
    const collection = await DatabaseService.getCollection('secure_items');
    const result = await collection.insertOne({
      name,
      description,
      category,
      created_by: authenticatedUser?.id,
      created_at: new Date(),
      updated_at: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      message: 'Item created successfully',
      data: {
        id: result.insertedId.toString(),
        name,
        description,
        category,
        created_by: authenticatedUser?.name || 'Unknown',
      }
    });
    
  } catch (error) {
    console.error('Secure POST endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR', 
      message: 'Failed to create item',
    }, { status: 500 });
  }
}, SecurityPresets.admin);

// PUT - Manager-level endpoint  
export const PUT = withSecurity(async (request: AuthenticatedNextRequest) => {
  try {
    const body = await request.json();
    const { id, status } = body;
    
    const validation = Validator.validate([
      {
        field: 'id',
        value: id,
        rules: ['required', 'objectId']
      },
      {
        field: 'status',
        value: status,
        rules: ['required']
      }
    ]);
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: validation.errors,
      }, { status: 400 });
    }
    
    const authenticatedUser = request.user;
    
    const collection = await DatabaseService.getCollection('secure_items');
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updated_by: authenticatedUser?.id,
          updated_at: new Date(),
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Item not found',
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Item updated successfully',
      modified_count: result.modifiedCount,
    });
    
  } catch (error) {
    console.error('Secure PUT endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update item',
    }, { status: 500 });
  }
}, SecurityPresets.manager);

// DELETE - Admin-only with strict validation
export const DELETE = withSecurity(async (request: AuthenticatedNextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_PARAMETER',
        message: 'ID parameter is required',
      }, { status: 400 });
    }
    
    const validation = Validator.validate([
      {
        field: 'id',
        value: id,
        rules: ['required', 'objectId']
      }
    ]);
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid ID format',
        details: validation.errors,
      }, { status: 400 });
    }
    
    const authenticatedUser = request.user;
    
    const collection = await DatabaseService.getCollection('secure_items');
    
    // Check if item exists first
    const existingItem = await collection.findOne({ 
      _id: new ObjectId(id) 
    });
    
    if (!existingItem) {
      return NextResponse.json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Item not found',
      }, { status: 404 });
    }
    
    // Log the deletion for audit purposes
    console.log(`🗑️ Admin ${authenticatedUser?.id} deleting item ${id}`);
    
    const result = await collection.deleteOne({ 
      _id: new ObjectId(id) 
    });
    
    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
      deleted_count: result.deletedCount,
    });
    
  } catch (error) {
    console.error('Secure DELETE endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete item',
    }, { status: 500 });
  }
}, SecurityPresets.admin);