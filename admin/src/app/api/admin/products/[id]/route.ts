import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// GET - Fetch single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid product ID'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');

    const product = await productsCollection.findOne({ _id: new ObjectId(id) });
    
    await client.close();

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching the product'
    }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, category, stock_quantity, is_active, image_url } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid product ID'
      }, { status: 400 });
    }

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

    // Check if product exists
    const existingProduct = await productsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingProduct) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    // Check if another product with same name exists (excluding current product)
    const duplicateProduct = await productsCollection.findOne({
      name,
      _id: { $ne: new ObjectId(id) }
    });
    
    if (duplicateProduct) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Product name already exists',
        message: 'Another product with this name already exists'
      }, { status: 409 });
    }

    // Update product
    const updateData = {
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      stock_quantity: parseInt(stock_quantity),
      is_active: is_active !== undefined ? is_active : true,
      image_url: image_url || '',
      updated_at: new Date()
    };

    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    await client.close();

    if (result.modifiedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'No changes made',
        message: 'Product was not updated'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating the product'
    }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid product ID'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');

    // Check if product exists
    const existingProduct = await productsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingProduct) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    // TODO: Check if product is in any orders before deleting
    // For now, we'll allow deletion

    const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
    
    await client.close();

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete',
        message: 'Product could not be deleted'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while deleting the product'
    }, { status: 500 });
  }
}