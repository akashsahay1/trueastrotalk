import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// GET - Get user's addresses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing user ID',
        message: 'User ID is required'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const addressesCollection = db.collection('user_addresses');

    const addresses = await addressesCollection
      .find({ user_id: userId })
      .sort({ is_default: -1, created_at: -1 })
      .toArray();

    // Format addresses for response
    const formattedAddresses = addresses.map(address => ({
      _id: address._id.toString(),
      label: address.label,
      full_name: address.full_name,
      phone_number: address.phone_number,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      address_type: address.address_type,
      is_default: address.is_default,
      created_at: address.created_at,
      updated_at: address.updated_at
    }));

    await client.close();

    return NextResponse.json({
      success: true,
      addresses: formattedAddresses
    });

  } catch(error) {
    console.error('Addresses GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching addresses'
    }, { status: 500 });
  }
}

// POST - Create new address
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      label,
      full_name,
      phone_number,
      address_line_1,
      address_line_2 = '',
      city,
      state,
      postal_code,
      country = 'India',
      address_type = 'other',
      is_default = false
    } = body;

    // Validate required fields
    if (!user_id || !full_name || !phone_number || !address_line_1 || !city || !state || !postal_code) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'User ID, full name, phone number, address line 1, city, state, and postal code are required'
      }, { status: 400 });
    }

    // Validate postal code format (basic validation for Indian postal codes)
    const postalCodeRegex = /^[1-9][0-9]{5}$/;
    if (!postalCodeRegex.test(postal_code)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid postal code',
        message: 'Please enter a valid 6-digit postal code'
      }, { status: 400 });
    }

    // Validate phone number format (basic validation for Indian phone numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone_number.replace(/[^\d]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid phone number',
        message: 'Please enter a valid 10-digit phone number'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const addressesCollection = db.collection('user_addresses');

    // If this is set as default, unset other default addresses
    if (is_default) {
      await addressesCollection.updateMany(
        { user_id: user_id, is_default: true },
        { $set: { is_default: false, updated_at: new Date() } }
      );
    }

    // If this is the first address for the user, make it default
    const existingAddressCount = await addressesCollection.countDocuments({ user_id: user_id });
    const shouldBeDefault = is_default || existingAddressCount === 0;

    const addressData = {
      user_id: user_id,
      label: label || `${address_type.charAt(0).toUpperCase()}${address_type.slice(1)} Address`,
      full_name: full_name.trim(),
      phone_number: cleanPhone,
      address_line_1: address_line_1.trim(),
      address_line_2: address_line_2.trim(),
      city: city.trim(),
      state: state.trim(),
      postal_code: postal_code.trim(),
      country: country.trim(),
      address_type: address_type,
      is_default: shouldBeDefault,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await addressesCollection.insertOne(addressData);
    const addressId = result.insertedId.toString();

    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Address created successfully',
      address_id: addressId
    }, { status: 201 });

  } catch(error) {
    console.error('Addresses POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while creating address'
    }, { status: 500 });
  }
}

// PUT - Update address
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      address_id,
      user_id,
      label,
      full_name,
      phone_number,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      address_type,
      is_default
    } = body;

    if (!address_id || !user_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Address ID and User ID are required'
      }, { status: 400 });
    }

    if (!ObjectId.isValid(address_id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid address ID',
        message: 'Valid address ID is required'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const addressesCollection = db.collection('user_addresses');

    // Check if address exists and belongs to user
    const existingAddress = await addressesCollection.findOne({
      _id: new ObjectId(address_id),
      user_id: user_id
    });

    if (!existingAddress) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Address not found',
        message: 'Address not found or does not belong to user'
      }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date()
    };

    if (label !== undefined) updateData.label = label;
    if (full_name !== undefined) updateData.full_name = full_name.trim();
    if (phone_number !== undefined) {
      const cleanPhone = phone_number.replace(/[^\d]/g, '');
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(cleanPhone)) {
        await client.close();
        return NextResponse.json({
          success: false,
          error: 'Invalid phone number',
          message: 'Please enter a valid 10-digit phone number'
        }, { status: 400 });
      }
      updateData.phone_number = cleanPhone;
    }
    if (address_line_1 !== undefined) updateData.address_line_1 = address_line_1.trim();
    if (address_line_2 !== undefined) updateData.address_line_2 = address_line_2.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (state !== undefined) updateData.state = state.trim();
    if (postal_code !== undefined) {
      const postalCodeRegex = /^[1-9][0-9]{5}$/;
      if (!postalCodeRegex.test(postal_code)) {
        await client.close();
        return NextResponse.json({
          success: false,
          error: 'Invalid postal code',
          message: 'Please enter a valid 6-digit postal code'
        }, { status: 400 });
      }
      updateData.postal_code = postal_code.trim();
    }
    if (country !== undefined) updateData.country = country.trim();
    if (address_type !== undefined) updateData.address_type = address_type;

    // Handle default address setting
    if (is_default === true && !existingAddress.is_default) {
      // Unset other default addresses first
      await addressesCollection.updateMany(
        { user_id: user_id, is_default: true },
        { $set: { is_default: false, updated_at: new Date() } }
      );
      updateData.is_default = true;
    } else if (is_default === false) {
      updateData.is_default = false;
    }

    const result = await addressesCollection.updateOne(
      { _id: new ObjectId(address_id) },
      { $set: updateData }
    );

    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully'
    });

  } catch(error) {
    console.error('Addresses PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating address'
    }, { status: 500 });
  }
}

// DELETE - Delete address
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('addressId');
    const userId = searchParams.get('userId');

    if (!addressId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters',
        message: 'Address ID and User ID are required'
      }, { status: 400 });
    }

    if (!ObjectId.isValid(addressId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid address ID',
        message: 'Valid address ID is required'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const addressesCollection = db.collection('user_addresses');

    // Check if address exists and belongs to user
    const existingAddress = await addressesCollection.findOne({
      _id: new ObjectId(addressId),
      user_id: userId
    });

    if (!existingAddress) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Address not found',
        message: 'Address not found or does not belong to user'
      }, { status: 404 });
    }

    // Delete the address
    const result = await addressesCollection.deleteOne({
      _id: new ObjectId(addressId),
      user_id: userId
    });

    // If deleted address was default, make another address default
    if (existingAddress.is_default) {
      const remainingAddresses = await addressesCollection.find({ user_id: userId }).toArray();
      if (remainingAddresses.length > 0) {
        // Make the first remaining address default
        await addressesCollection.updateOne(
          { _id: remainingAddresses[0]._id },
          { $set: { is_default: true, updated_at: new Date() } }
        );
      }
    }

    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch(error) {
    console.error('Addresses DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while deleting address'
    }, { status: 500 });
  }
}