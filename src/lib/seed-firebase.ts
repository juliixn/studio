import { adminDb } from './firebase';
import { UserRole } from './definitions';
import { addDays, addMonths, subDays } from 'date-fns';

async function main() {
    console.log('Start seeding Firebase...');

    // Clear existing collections
    const collections = await adminDb.listCollections();
    for (const collection of collections) {
        console.log(`Deleting collection: ${collection.id}`);
        const snapshot = await collection.get();
        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
    console.log('All collections cleared.');
    
    // --- Create Condominios ---
    const condo1Ref = adminDb.collection('condominios').doc();
    await condo1Ref.set({
        name: 'Residencial Los Robles',
        mainAddress: 'Av. Principal 123, Ciudad',
        status: 'Activo',
        latitude: 19.4326,
        longitude: -99.1332,
        geofenceRadius: 300,
        guardsRequiredDiurno: 2,
        guardsRequiredNocturno: 1,
        guardMenuSections: ['vehicular', 'pedestrian', 'packages', 'bitacora', 'peticiones', 'active_exits', 'notifications', 'reservations', 'my_payroll', 'my_loans']
    });

    const condo2Ref = adminDb.collection('condominios').doc();
    await condo2Ref.set({
        name: 'Torres del Parque',
        mainAddress: 'Calle Central 456, Ciudad',
        status: 'Activo',
        latitude: 19.4285,
        longitude: -99.1276,
        geofenceRadius: 250,
        guardsRequiredDiurno: 1,
        guardsRequiredNocturno: 1,
        guardMenuSections: ['vehicular', 'pedestrian', 'bitacora', 'active_exits']
    });

    // --- Create Addresses ---
    const address1_1Ref = adminDb.collection('addresses').doc();
    await address1_1Ref.set({ fullAddress: 'Casa 101', condominioId: condo1Ref.id });
    const address1_2Ref = adminDb.collection('addresses').doc();
    await address1_2Ref.set({ fullAddress: 'Casa 102', condominioId: condo1Ref.id });
    const address2_1Ref = adminDb.collection('addresses').doc();
    await address2_1Ref.set({ fullAddress: 'Torre A - Depto 501', condominioId: condo2Ref.id });
    const address2_2Ref = adminDb.collection('addresses').doc();
    await address2_2Ref.set({ fullAddress: 'Torre B - Depto 203', condominioId: condo2Ref.id });
    
     // --- Create Users ---
    const usersBatch = adminDb.batch();
    
    const adminRef = adminDb.collection('users').doc('admin@glomar.com');
    usersBatch.set(adminRef, {
        username: 'admin',
        name: 'Administrador General',
        email: 'admin@glomar.com',
        password: 'admin',
        role: UserRole.Administrador,
        photoUrl: 'https://i.postimg.cc/13k5g2s6/image.png'
    });

    const admCondoRef = adminDb.collection('users').doc('admcondo@glomar.com');
    usersBatch.set(admCondoRef, {
        username: 'admcondo',
        name: 'Admin Robles',
        email: 'admcondo@glomar.com',
        password: 'password123',
        role: UserRole.Adm_Condo,
        condominioIds: [condo1Ref.id],
        photoUrl: 'https://i.postimg.cc/L5YwzcvJ/image.png'
    });

    const propietarioRef = adminDb.collection('users').doc('jperez@condominio.com');
    usersBatch.set(propietarioRef, {
        username: 'jperez',
        name: 'Juan Pérez',
        email: 'jperez@condominio.com',
        password: 'password123',
        role: UserRole.Propietario,
        photoUrl: 'https://i.postimg.cc/k4JAx7F1/image.png',
        addressIds: [address1_1Ref.id, address2_1Ref.id],
    });

    const rentaRef = adminDb.collection('users').doc('mgarcia@condominio.com');
    usersBatch.set(rentaRef, {
        username: 'mgarcia',
        name: 'Maria García',
        email: 'mgarcia@condominio.com',
        password: 'password123',
        role: UserRole.Renta,
        photoUrl: 'https://i.postimg.cc/6pQpXGj1/image.png',
        addressId: address1_2Ref.id,
        leaseStartDate: new Date(),
        leaseEndDate: addMonths(new Date(), 12)
    });

    const guardiaRef = adminDb.collection('users').doc('csanchez@glomar.com');
    usersBatch.set(guardiaRef, {
        username: 'csanchez',
        name: 'Carlos Sánchez',
        email: 'csanchez@glomar.com',
        password: 'password123',
        role: UserRole.Guardia,
        dailySalary: 550.0,
        photoUrl: 'https://i.postimg.cc/Y0G3SFTT/image.png'
    });

    await usersBatch.commit();


    // --- Create Lists ---
    const initialLists = {
        visitorTypes: ['Visitante', 'Proveedor', 'Empleado', 'Servicio a Domicilio', 'Familiar'],
        vehicleVisitorTypes: ['Visitante', 'Proveedor', 'Empleado', 'Servicio a Domicilio', 'Taxi/Uber', 'Familiar'],
        vehicleTypes: ['Automóvil Compacto', 'Automóvil Sedán', 'SUV', 'Camioneta Pick-Up', 'Motocicleta', 'Van', 'Camión'],
        vehicleBrands: ['Nissan', 'Chevrolet', 'Volkswagen', 'Ford', 'Toyota', 'Honda', 'Kia', 'Mazda'],
        vehicleColors: ['Blanco', 'Negro', 'Gris', 'Plata', 'Rojo', 'Azul', 'Verde', 'Amarillo'],
        equipment: ['Radio', 'Teléfono Celular', 'Lámpara', 'Libro de Novedades', 'Llaves'],
        incidentCategories: ['Sospechoso', 'Daño a Propiedad', 'Falla de Servicio', 'Conflicto', 'Médica', 'Otro'],
        providerTypes: ['Paquetería', 'Supermercado', 'Gas', 'Agua', 'Internet/Cable'],
        employeeTypes: ['Doméstica', 'Jardinería', 'Mantenimiento', 'Otro'],
    };

    const listsBatch = adminDb.batch();
    for (const [key, values] of Object.entries(initialLists)) {
        const listRef = adminDb.collection('lists').doc(key);
        listsBatch.set(listRef, { values });
    }
    await listsBatch.commit();
    
    // --- Create a ShiftRecord ---
    const shiftRecordRef = adminDb.collection('shiftRecords').doc();
    await shiftRecordRef.set({
        guardId: 'csanchez@glomar.com',
        guardName: 'Carlos Sánchez',
        condominioId: condo1Ref.id,
        condominioName: 'Residencial Los Robles',
        turno: 'Diurno',
        startTime: subDays(new Date(), 1),
        endTime: subDays(new Date(), 1),
    });

    // --- Create a Peticion ---
    const peticionRef = adminDb.collection('peticiones').doc();
    await peticionRef.set({
        title: "Foco fundido en pasillo",
        description: "El foco del pasillo del 3er piso, frente al elevador, está fundido.",
        creatorId: 'jperez@condominio.com',
        creatorName: 'Juan Pérez',
        creatorRole: UserRole.Propietario,
        condominioId: condo1Ref.id,
        condominioName: 'Residencial Los Robles',
        status: 'Abierta',
        createdAt: new Date(),
        comments: [],
    });

    console.log('Seeding finished.');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
