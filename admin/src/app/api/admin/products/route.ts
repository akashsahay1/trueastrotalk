import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// GET - Fetch all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');

    // Build query
    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (active !== null && active !== undefined) query.is_active = active === 'true';

    // Get products with pagination
    const products = await productsCollection.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalProducts = await productsCollection.countDocuments(query);

    await client.close();

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit)
      }
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching products'
    }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, category, stock_quantity, is_active, image_url } = body;

    // Validate required fields
    if (!name || !price || !category || stock_quantity === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, price, category, and stock quantity are required'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');

    // Check if product with same name already exists
    const existingProduct = await productsCollection.findOne({ name });
    if (existingProduct) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Product already exists',
        message: 'A product with this name already exists'
      }, { status: 409 });
    }

    // Create product document
    const productData = {
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      stock_quantity: parseInt(stock_quantity),
      is_active: is_active !== undefined ? is_active : true,
      image_url: image_url || '',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await productsCollection.insertOne(productData);
    
    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product_id: result.insertedId
    }, { status: 201 });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while creating the product'
    }, { status: 500 });
  }
}