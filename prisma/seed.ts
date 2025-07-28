
import { PrismaClient } from '@prisma/client';
import { addDays, addMonths, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clear existing data
  await prisma.directMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.vehicleInfo.deleteMany();
  await prisma.peticionComment.deleteMany();
  await prisma.peticion.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.survey.deleteMany();
  await prisma.communityEvent.deleteMany();
  await prisma.shiftRecord.deleteMany();
  await prisma.plannedShift.deleteMany();
  await prisma.handoverNote.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.archivedPayroll.deleteMany();
  await prisma.bitacoraEntry.deleteMany();
  await prisma.package.deleteMany();
  await prisma.guestPass.deleteMany();
  await prisma.visitorNotification.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.commonArea.deleteMany();
  await prisma.pedestrianRegistration.deleteMany();
  await prisma.vehicularRegistration.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.comunicado.deleteMany();
  await prisma.alertResponse.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.address.deleteMany();
  await prisma.condominio.deleteMany();
  await prisma.user.deleteMany();
  await prisma.list.deleteMany();
  
  console.log('Old data cleared.');
  
  // Create Condominios
  const condo1 = await prisma.condominio.create({
    data: {
      name: 'Residencial Los Robles',
      mainAddress: 'Av. Principal 123, Ciudad',
      status: 'Activo',
      latitude: 19.4326,
      longitude: -99.1332,
      geofenceRadius: 300,
      guardsRequiredDiurno: 2,
      guardsRequiredNocturno: 1,
      guardMenuSections: 'vehicular,pedestrian,packages,bitacora,peticiones,active_exits,notifications,reservations,my_payroll,my_loans',
    },
  });

  const condo2 = await prisma.condominio.create({
    data: {
      name: 'Torres del Parque',
      mainAddress: 'Calle Central 456, Ciudad',
      status: 'Activo',
      latitude: 19.4285,
      longitude: -99.1276,
      geofenceRadius: 250,
      guardsRequiredDiurno: 1,
      guardsRequiredNocturno: 1,
      guardMenuSections: 'vehicular,pedestrian,bitacora,active_exits',
    },
  });
  console.log('Created Condominios');

  // Create Addresses
  const address1_1 = await prisma.address.create({ data: { fullAddress: 'Casa 101', condominioId: condo1.id } });
  const address1_2 = await prisma.address.create({ data: { fullAddress: 'Casa 102', condominioId: condo1.id } });
  const address2_1 = await prisma.address.create({ data: { fullAddress: 'Torre A - Depto 501', condominioId: condo2.id } });
  console.log('Created Addresses');

  // Create Users
  const admin = await prisma.user.create({
    data: {
      id: 'admin@glomar.com',
      username: 'admin', name: 'Administrador General', email: 'admin@glomar.com',
      password: 'admin', role: 'Administrador', photoUrl: 'https://i.postimg.cc/13k5g2s6/image.png'
    }
  });

  const admCondo = await prisma.user.create({
    data: {
      id: 'admcondo@glomar.com',
      username: 'admcondo', name: 'Admin Robles', email: 'admcondo@glomar.com',
      password: 'password123', role: 'Adm. Condo', condominioIds: condo1.id, photoUrl: 'https://i.postimg.cc/L5YwzcvJ/image.png'
    }
  });

  const propietario = await prisma.user.create({
    data: {
      id: 'jperez@condominio.com',
      username: 'jperez', name: 'Juan Pérez', email: 'jperez@condominio.com',
      password: 'password123', role: 'Propietario', photoUrl: 'https://i.postimg.cc/k4JAx7F1/image.png',
      addressIds: [address1_1.id, address2_1.id].join(','),
      condominioIds: [condo1.id, condo2.id].join(',')
    }
  });

  const renta = await prisma.user.create({
    data: {
      id: 'mgarcia@condominio.com',
      username: 'mgarcia', name: 'Maria García', email: 'mgarcia@condominio.com',
      password: 'password123', role: 'Renta', photoUrl: 'https://i.postimg.cc/6pQpXGj1/image.png',
      addressId: address1_2.id, condominioId: condo1.id,
      leaseStartDate: new Date(), leaseEndDate: addMonths(new Date(), 12)
    }
  });
  
  const guardia = await prisma.user.create({
    data: {
      id: 'csanchez@glomar.com',
      username: 'csanchez', name: 'Carlos Sánchez', email: 'csanchez@glomar.com',
      password: 'password123', role: 'Guardia', dailySalary: 550.0, photoUrl: 'https://i.postimg.cc/Y0G3SFTT/image.png'
    }
  });
  console.log('Created Users');

  // Create Lists
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
  for (const [key, values] of Object.entries(initialLists)) {
      await prisma.list.create({ data: { key, values } });
  }
  console.log('Created Lists');
  
  // Create sample data for other models
  await prisma.shiftRecord.create({
      data: {
          guardId: guardia.id, guardName: guardia.name, condominioId: condo1.id, condominioName: condo1.name,
          turno: 'Diurno', startTime: subDays(new Date(), 1), endTime: subDays(new Date(), 1),
      }
  });
  
  const peticion = await prisma.peticion.create({
      data: {
          title: "Foco fundido en pasillo",
          description: "El foco del pasillo del 3er piso, frente al elevador, está fundido.",
          creatorId: propietario.id, creatorName: propietario.name, creatorRole: 'Propietario',
          condominioId: condo1.id, condominioName: condo1.name, status: 'Abierta',
      }
  });
  
  await prisma.peticionComment.create({
      data: {
        peticionId: peticion.id,
        authorId: admin.id,
        authorName: admin.name,
        text: 'Recibido. Se asignará a mantenimiento.'
      }
  });
  
  await prisma.vehicularRegistration.create({
    data: {
      licensePlate: 'ABC-123', fullName: 'Visitante Vehicular', visitorType: 'Visitante',
      vehicleType: 'Automóvil Sedán', vehicleBrand: 'Nissan', vehicleColor: 'Rojo',
      address: address1_1.fullAddress, condominioId: condo1.id, condominioName: condo1.name,
      entryTimestamp: subDays(new Date(), 1)
    }
  });

  await prisma.pedestrianRegistration.create({
    data: {
      fullName: 'Visitante Peatonal', visitorType: 'Visitante', address: address1_2.fullAddress,
      condominioId: condo1.id, condominioName: condo1.name, entryTimestamp: subDays(new Date(), 2)
    }
  });

  await prisma.package.create({
    data: {
      recipientId: propietario.id, recipientAddress: address1_1.fullAddress, recipientName: propietario.name,
      courierCompany: 'Mercado Libre', courierName: 'Juan Entregas', status: 'En Recepción',
      receivedByGuardId: guardia.id, receivedByGuardName: guardia.name, condominioId: condo1.id
    }
  });

  const area = await prisma.commonArea.create({
    data: {
      name: 'Salón de Eventos', description: 'Área para fiestas y reuniones.', capacity: 50,
      condominioId: condo1.id, imageUrl: 'https://placehold.co/600x400.png', cost: 500
    }
  });

  await prisma.reservation.create({
    data: {
      areaId: area.id, areaName: area.name, userId: propietario.id, userName: propietario.name,
      date: format(new Date(), 'yyyy-MM-dd'), startTime: '14:00', endTime: '18:00',
      status: 'Aprobada', condominioId: condo1.id
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
