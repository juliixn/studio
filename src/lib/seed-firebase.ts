
import { adminDb } from './firebase';
import { mockUsers, mockCondominios, allAddresses, mockEmergencyContacts, mockAssets, mockCommonAreas, mockReservations, mockPackages, mockPeticiones, mockBitacoraEntries, mockShiftRecords, mockWorkOrders, mockSurveys, mockEvents, mockPanicAlerts, mockAlertResponses, mockChatMessages, mockDirectMessages, mockConversations, mockHandoverNotes, mockLoans, mockArchivedPayrolls, mockPlannedShifts, mockTransactions, mockResidentAccounts } from './data';
import { listKeys, mockLists } from './data-lists';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function seedData() {
    console.log('Starting to seed data into Firestore...');

    // Hash passwords for mock users
    const hashedUsers = await Promise.all(
        mockUsers.map(async (user) => {
            if (user.password) {
                const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
                return { ...user, password: hashedPassword };
            }
            return user;
        })
    );

    const collectionsToSeed = [
        { name: 'users', data: hashedUsers, idField: 'email' },
        { name: 'condominios', data: mockCondominios, idField: 'id' },
        { name: 'addresses', data: allAddresses, idField: 'id' },
        { name: 'emergencyContacts', data: mockEmergencyContacts, idField: 'id' },
        { name: 'assets', data: mockAssets, idField: 'id' },
        { name: 'commonAreas', data: mockCommonAreas, idField: 'id' },
        { name: 'reservations', data: mockReservations, idField: 'id' },
        { name: 'packages', data: mockPackages, idField: 'id' },
        { name: 'peticiones', data: mockPeticiones, idField: 'id' },
        { name: 'bitacora', data: mockBitacoraEntries, idField: 'id' },
        { name: 'shifts', data: mockShiftRecords, idField: 'id' },
        { name: 'workOrders', data: mockWorkOrders, idField: 'id' },
        { name: 'surveys', data: mockSurveys, idField: 'id' },
        { name: 'communityEvents', data: mockEvents, idField: 'id' },
        { name: 'panicAlerts', data: mockPanicAlerts, idField: 'id' },
        { name: 'alertResponses', data: mockAlertResponses, idField: 'id' },
        { name: 'chatMessages', data: mockChatMessages, idField: 'id' },
        { name: 'directMessages', data: mockDirectMessages, idField: 'id' },
        { name: 'conversations', data: mockConversations, idField: 'id' },
        { name: 'handoverNotes', data: mockHandoverNotes, idField: 'id' },
        { name: 'loans', data: mockLoans, idField: 'id' },
        { name: 'archivedPayrolls', data: mockArchivedPayrolls, idField: 'id' },
        { name: 'plannedShifts', data: mockPlannedShifts, idField: 'id' },
        { name: 'transactions', data: mockTransactions, idField: 'id' },
        { name: 'residentAccounts', data: mockResidentAccounts, idField: 'residentId' },
    ];
    
    for (const collection of collectionsToSeed) {
        console.log(`Seeding collection: ${collection.name}...`);
        const collectionRef = adminDb.collection(collection.name);
        
        // Optional: Delete existing documents
        const snapshot = await collectionRef.get();
        if (snapshot.size > 0) {
            const batchDelete = adminDb.batch();
            snapshot.docs.forEach(doc => batchDelete.delete(doc.ref));
            await batchDelete.commit();
            console.log(`  - Cleared ${snapshot.size} existing documents in ${collection.name}.`);
        }
        
        // Add new documents
        if (collection.data.length > 0) {
            const batchAdd = adminDb.batch();
            for (const item of collection.data) {
                const docId = (item as any)[collection.idField];
                const docRef = collectionRef.doc(docId);
                batchAdd.set(docRef, item);
            }
            await batchAdd.commit();
            console.log(`  - Added ${collection.data.length} documents to ${collection.name}.`);
        } else {
             console.log(`  - No documents to add to ${collection.name}.`);
        }
    }

    // Seed lists
    console.log('Seeding collection: lists...');
    const listCollectionRef = adminDb.collection('lists');
    const snapshotLists = await listCollectionRef.get();
    if (snapshotLists.size > 0) {
        const batchDeleteLists = adminDb.batch();
        snapshotLists.docs.forEach(doc => batchDeleteLists.delete(doc.ref));
        await batchDeleteLists.commit();
        console.log('  - Cleared existing documents in lists.');
    }

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
