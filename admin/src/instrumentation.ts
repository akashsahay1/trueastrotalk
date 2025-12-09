/**
 * Next.js Instrumentation - runs on app startup
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { syncUploadsToMedia } = await import('./lib/media-sync');

    // Run media sync on startup
    await syncUploadsToMedia();
  }
}
