
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const startTime = Date.now();
    const db = await getDb();
    const endTimeInit = Date.now();

    const collections = await db.listCollections();
    const endTimeList = Date.now();
    
    const collectionIds = collections.map(c => c.id);

    // Try a simple read operation that we know hangs in the webhook
    const usersCollection = db.collection('users');
    const snapshot = await usersCollection.limit(1).get();
    const endTimeRead = Date.now();

    const results = {
      status: 'success',
      timings: {
        init: `${endTimeInit - startTime}ms`,
        listCollections: `${endTimeList - endTimeInit}ms`,
        readOneUser: `${endTimeRead - endTimeList}ms`,
      },
      collectionsFound: collectionIds,
      usersRead: snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })),
    };
    
    return NextResponse.json(results);

  } catch (error: any) {
    console.error("Debug check failed:", error);
    return NextResponse.json(
      { 
        status: 'error',
        message: error.message,
        stack: error.stack,
        code: error.code, // Include gRPC code if available
      }, 
      { status: 500 }
    );
  }
}
