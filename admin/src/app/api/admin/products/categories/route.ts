import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// GET - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const categoriesCollection = db.collection('product_categories');
    const productsCollection = db.collection('products');

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

    await client.close();

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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, is_active } = body;

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

    // Check if category with same name already exists
    const existingCategory = await categoriesCollection.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingCategory) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Category already exists',
        message: 'A category with this name already exists'
      }, { status: 409 });
    }

    // Create category document
    const categoryData = {
      name: name.trim(),
      description: description || '',
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await categoriesCollection.insertOne(categoryData);
    
    await client.close();

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