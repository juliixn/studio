
import { adminDb } from './firebase';
import { mockUsers, mockCondominios, allAddresses, mockEmergencyContacts, mockAssets, mockCommonAreas } from './data';
import { listKeys, mockLists } from './data-lists';

async function seedData() {
    console.log('Starting to seed data into Firestore...');

    const collectionsToSeed = [
        { name: 'users', data: mockUsers, idField: 'email' },
        { name: 'condominios', data: mockCondominios, idField: 'id' },
        { name: 'addresses', data: allAddresses, idField: 'id' },
        { name: 'emergencyContacts', data: mockEmergencyContacts, idField: 'id' },
        { name: 'assets', data: mockAssets, idField: 'id' },
        { name: 'commonAreas', data: mockCommonAreas, idField: 'id' },
    ];
    
    for (const collection of collectionsToSeed) {
        console.log(`Seeding collection: ${collection.name}...`);
        const collectionRef = adminDb.collection(collection.name);
        
        // Optional: Delete existing documents
        const snapshot = await collectionRef.get();
        const batchDelete = adminDb.batch();
        snapshot.docs.forEach(doc => batchDelete.delete(doc.ref));
        await batchDelete.commit();
        console.log(`  - Cleared existing documents in ${collection.name}.`);
        
        // Add new documents
        const batchAdd = adminDb.batch();
        for (const item of collection.data) {
            const docId = (item as any)[collection.idField];
            const docRef = collectionRef.doc(docId);
            batchAdd.set(docRef, item);
        }
        await batchAdd.commit();
        console.log(`  - Added ${collection.data.length} documents to ${collection.name}.`);
    }

    // Seed lists
    console.log('Seeding collection: lists...');
    const listCollectionRef = adminDb.collection('lists');
    const snapshot = await listCollectionRef.get();
    const batchDeleteLists = adminDb.batch();
    snapshot.docs.forEach(doc => batchDeleteLists.delete(doc.ref));
    await batchDeleteLists.commit();
    console.log('  - Cleared existing documents in lists.');

    const batchAddLists = adminDb.batch();
    for (const key of listKeys) {
        const docRef = listCollectionRef.doc(key);
        batchAddLists.set(docRef, { key, values: mockLists[key] });
    }
    await batchAddLists.commit();
    console.log(`  - Added ${listKeys.length} list documents.`);


    console.log('Seeding complete!');
}

seedData().catch((e) => {
  console.error(e);
  process.exit(1);
});
