import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { withSecurity, SecurityPresets } from '@/lib/api-security';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// GET - Fetch single category
async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category ID'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const categoriesCollection = db.collection('product_categories');
    const productsCollection = db.collection('products');

    const category = await categoriesCollection.findOne({ _id: new ObjectId(id) });
    
    if (!category) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 });
    }

    // Get product count for this category
    const productCount = await productsCollection.countDocuments({
      category: category.name
    });

    await client.close();

    return NextResponse.json({
      success: true,
      category: {
        ...category,
        product_count: productCount
      }
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching the category'
    }, { status: 500 });
  }
}

// PUT - Update category
async function handlePUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, is_active } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category ID'
      }, { status: 400 });
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Category name is required'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const categoriesCollection = db.collection('product_categories');
    const productsCollection = db.collection('products');

    // Check if category exists
    const existingCategory = await categoriesCollection.findOne({ _id: new ObjectId(id) });
    if (!existingCategory) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 });
    }

    // Check if another category with same name exists (excluding current category)
    const duplicateCategory = await categoriesCollection.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: new ObjectId(id) }
    });
    
    if (duplicateCategory) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Category name already exists',
        message: 'Another category with this name already exists'
      }, { status: 409 });
    }

    const oldName = existingCategory.name;
    const newName = name.trim();

    // Update category
    const updateData = {
      name: newName,
      description: description || '',
      is_active: is_active !== undefined ? is_active : true,
      updated_at: new Date()
    };

    const result = await categoriesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // If category name changed, update all products that use this category
    if (oldName !== newName) {
      await productsCollection.updateMany(
        { category: oldName },
        { $set: { category: newName, updated_at: new Date() } }
      );
    }

    await client.close();

    if (result.modifiedCount === 0 && oldName === newName) {
      return NextResponse.json({
        success: false,
        error: 'No changes made',
        message: 'Category was not updated'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully'
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating the category'
    }, { status: 500 });
  }
}

// DELETE - Delete category
async function handleDELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category ID'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const categoriesCollection = db.collection('product_categories');
    const productsCollection = db.collection('products');

    // Check if category exists
    const existingCategory = await categoriesCollection.findOne({ _id: new ObjectId(id) });
    if (!existingCategory) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 });
    }

    // Check if any products are using this category
    const productsUsingCategory = await productsCollection.countDocuments({
      category: existingCategory.name
    });

    if (productsUsingCategory > 0) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Cannot delete category',
        message: `This category is being used by ${productsUsingCategory} product(s). Please reassign or delete those products first.`
      }, { status: 400 });
    }

    const result = await categoriesCollection.deleteOne({ _id: new ObjectId(id) });
    
    await client.close();

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete',
        message: 'Category could not be deleted'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while deleting the category'
    }, { status: 500 });
  }
}

// Export secured handlers with admin-only access
export const GET = withSecurity(handleGET, SecurityPresets.admin);
export const PUT = withSecurity(handlePUT, SecurityPresets.admin);
export const DELETE = withSecurity(handleDELETE, SecurityPresets.admin);