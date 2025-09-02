import { NextRequest, NextResponse } from 'next/server';
import { Server as NetServer } from 'http';
import { Server as ServerIO } from 'socket.io';

// Global type for socket storage
declare global {
  var socketIO: ServerIO | undefined;
}

export async function GET() {
  // In App Router, we need to handle Socket.IO differently
  // This endpoint will initialize Socket.IO if it hasn't been initialized
  const res = NextResponse.json({ 
    message: 'Socket.IO endpoint - use WebSocket connection',
    url: 'ws://localhost:4002/socket.io/'
  });

  // Initialize Socket.IO server if it hasn't been initialized
  try {
    if (!global.socketIO) {
      console.log('🔌 Initializing Socket.IO server...');
      
      // For App Router, we need to create the Socket.IO server manually
      // This is a simplified approach - in production, you might want to use a separate server
      const { createServer } = await import('http');
      const httpServer = createServer();
      const io = new ServerIO(httpServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        },
        pingTimeout: 60000,
        pingInterval: 25000
      });

      // Store globally to prevent multiple initializations
      global.socketIO = io;

      console.log('✅ Socket.IO server initialized');
    }

    return res;
  } catch (error) {
    console.error('❌ Failed to initialize Socket.IO:', error);
    return NextResponse.json({
      error: 'Failed to initialize Socket.IO server',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle other HTTP methods if needed
export async function POST() {
  return NextResponse.json({ message: 'Socket.IO uses WebSocket protocol' });
}

export async function PUT() {
  return NextResponse.json({ message: 'Socket.IO uses WebSocket protocol' });
}

export async function DELETE() {
  return NextResponse.json({ message: 'Socket.IO uses WebSocket protocol' });
}