import { NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';

export async function POST() {
  try {
    // Connect to MongoDB
    const usersCollection = await DatabaseService.getCollection('users');

    const results = [];

    // Drop phone_number unique index if it exists
    try {
      await usersCollection.dropIndex('phone_number_1');
      results.push('Successfully dropped phone_number_1 unique index');
    } catch (error: unknown) {
      const mongoError = error as { code?: number; message?: string };
      if (mongoError.code === 27) {
        results.push('phone_number_1 index does not exist (already removed)');
      } else {
        results.push(`Error dropping phone_number_1 index: ${mongoError.message || 'Unknown error'}`);
      }
    }

    // List all indexes to verify
    const indexes = await usersCollection.listIndexes().toArray();
    results.push(`Current indexes: ${indexes.map(idx => idx.name).join(', ')}`);
    return NextResponse.json({
      success: true,
      message: 'Database index fix completed',
      results
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Database fix failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}