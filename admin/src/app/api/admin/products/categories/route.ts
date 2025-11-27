import { NextRequest, NextResponse } from 'next/server';
import { generateCategoryId } from '@/lib/custom-id';
import { withSecurity, SecurityPresets, AuthenticatedNextRequest, getRequestBody } from '@/lib/api-security';
import DatabaseService from '@/lib/database';

// GET - Fetch all categories
async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const categoriesCollection = await DatabaseService.getCollection('product_categories');
    const productsCollection = await DatabaseService.getCollection('products');

    // Build query
    const query: Record<string, unknown> = {};
    if (active !== null && active !== undefined) query.is_active = active === 'true';

    // Get categories
    const categories = await categoriesCollection.find(query)
      .sort({ created_at: -1 })
      .toArray();

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await productsCollection.countDocuments({
          category: category.name
        });
        return {
          ...category,
          product_count: productCount
        };
      })
    );

    return NextResponse.json({
      success: true,
      categories: categoriesWithCount
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching categories'
    }, { status: 500 });
  }
}

// POST - Create new category
async function handlePOST(request: AuthenticatedNextRequest) {
  try {
    const body = await getRequestBody<{ name: string; description?: string; is_active?: boolean }>(request);
    if (!body) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body'
      }, { status: 400 });
    }
    const { name, description, is_active } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Category name is required'
      }, { status: 400 });
    }

    const categoriesCollection = await DatabaseService.getCollection('product_categories');

    // Check if category with same name already exists
    const existingCategory = await categoriesCollection.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existingCategory) {
      return NextResponse.json({
        success: false,
        error: 'Category already exists',
        message: 'A category with this name already exists'
      }, { status: 409 });
    }

    // Create category document
    const categoryData = {
      category_id: generateCategoryId(),
      name: name.trim(),
      description: description || '',
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await categoriesCollection.insertOne(categoryData);

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      category_id: result.insertedId
    }, { status: 201 });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while creating the category'
    }, { status: 500 });
  }
}

// Export secured handlers with admin-only access
export const GET = withSecurity(handleGET, SecurityPresets.admin);
export const POST = withSecurity(handlePOST, SecurityPresets.admin);