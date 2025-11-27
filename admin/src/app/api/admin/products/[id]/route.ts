import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { withSecurity, SecurityPresets, AuthenticatedNextRequest, getRequestBody } from '@/lib/api-security';
import DatabaseService from '@/lib/database';

// Helper function to convert relative image URLs to full URLs
function getFullImageUrl(imageUrl: string | null | undefined, request: NextRequest): string | null {
  if (!imageUrl || imageUrl.trim() === '') {
    return null;
  }
  
  // If it's already a full URL (starts with http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Dynamically get the base URL from the request
  const url = new URL(request.url);
  let host = url.host;
  
  // Replace 0.0.0.0 with localhost for better compatibility
  if (host.startsWith('0.0.0.0:')) {
    host = host.replace('0.0.0.0:', 'localhost:');
  }
  
  // Use the same protocol as the request (http in dev, https in prod)
  const protocol = url.protocol;
  const baseUrl = `${protocol}//${host}`;
  
  // If it's a relative path, construct full URL
  if (imageUrl.startsWith('/')) {
    return `${baseUrl}${imageUrl}`;
  }
  
  // If it doesn't start with /, add / prefix and then construct full URL  
  return `${baseUrl}/${imageUrl}`;
}

// GET - Fetch single product
async function handleGET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context;
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid product ID'
      }, { status: 400 });
    }

    const productsCollection = await DatabaseService.getCollection('products');

    const product = await productsCollection.findOne({ _id: new ObjectId(id) });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    // Transform product to include full image URL
    const productWithFullUrl = {
      ...product,
      image_url: getFullImageUrl(product.image_url, request)
    };

    return NextResponse.json({
      success: true,
      product: productWithFullUrl
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
async function handlePUT(
  request: AuthenticatedNextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context;
  try {
    const { id } = await params;
    const body = await getRequestBody<{ name: string; description?: string; price: number; category: string; stock_quantity: number; is_active?: boolean; image_url?: string }>(request);
    if (!body) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body'
      }, { status: 400 });
    }
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

    const productsCollection = await DatabaseService.getCollection('products');

    // Check if product exists
    const existingProduct = await productsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingProduct) {
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
async function handleDELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context;
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid product ID'
      }, { status: 400 });
    }

    const productsCollection = await DatabaseService.getCollection('products');

    // Check if product exists
    const existingProduct = await productsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingProduct) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    // TODO: Check if product is in any orders before deleting
    // For now, we'll allow deletion

    const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });

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

// Export secured handlers with admin-only access
// Wrapper to handle Next.js context parameter
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const securedHandler = withSecurity(
    async (req: NextRequest) => handleGET(req, context),
    SecurityPresets.admin
  );
  return securedHandler(request);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const securedHandler = withSecurity(
    async (req: NextRequest) => handlePUT(req, context),
    SecurityPresets.admin
  );
  return securedHandler(request);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const securedHandler = withSecurity(
    async (req: NextRequest) => handleDELETE(req, context),
    SecurityPresets.admin
  );
  return securedHandler(request);
}