
import { PrismaClient, UserRole } from '@prisma/client';
import { addDays, addMonths, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Clean up existing data
  await prisma.peticionComment.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.peticion.deleteMany();
  await prisma.bitacoraEntry.deleteMany();
  await prisma.vehicularRegistration.deleteMany();
  await prisma.pedestrianRegistration.deleteMany();
  await prisma.guestPass.deleteMany();
  await prisma.package.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.survey.deleteMany();
  await prisma.communityEvent.deleteMany();
  await prisma.alertResponse.deleteMany();
  await prisma.shiftRecord.deleteMany();
  await prisma.plannedShift.deleteMany();
  await prisma.archivedPayroll.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.list.deleteMany();
  await prisma.directMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.address.deleteMany();
  await prisma.condominio.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();


  // --- Create Condominios ---
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
      guardMenuSections: ['vehicular', 'pedestrian', 'packages', 'bitacora', 'peticiones', 'active_exits', 'notifications', 'reservations', 'my_payroll', 'my_loans']
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
      guardMenuSections: ['vehicular', 'pedestrian', 'bitacora', 'active_exits']
    },
  });

  // --- Create Addresses ---
  const address1_1 = await prisma.address.create({ data: { fullAddress: 'Casa 101', condominioId: condo1.id } });
  const address1_2 = await prisma.address.create({ data: { fullAddress: 'Casa 102', condominioId: condo1.id } });
  const address2_1 = await prisma.address.create({ data: { fullAddress: 'Torre A - Depto 501', condominioId: condo2.id } });
  const address2_2 = await prisma.address.create({ data: { fullAddress: 'Torre B - Depto 203', condominioId: condo2.id } });


  // --- Create Users ---
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      name: 'Administrador General',
      email: 'admin@glomar.com',
      password: 'admin',
      role: UserRole.Administrador,
      photoUrl: 'https://i.postimg.cc/13k5g2s6/image.png'
    },
  });

  const admCondo = await prisma.user.create({
      data: {
          username: 'admcondo',
          name: 'Admin Robles',
          email: 'admcondo@glomar.com',
          password: 'password123',
          role: UserRole.Adm_Condo,
          condominios: { connect: { id: condo1.id } },
          photoUrl: 'https://i.postimg.cc/L5YwzcvJ/image.png'
      }
  });

  const propietario = await prisma.user.create({
      data: {
          username: 'jperez',
          name: 'Juan Pérez',
          email: 'jperez@condominio.com',
          password: 'password123',
          role: UserRole.Propietario,
          photoUrl: 'https://i.postimg.cc/k4JAx7F1/image.png',
          domicilios: { connect: [{ id: address1_1.id }, { id: address2_1.id }] }
      }
  });

  const renta = await prisma.user.create({
      data: {
          username: 'mgarcia',
          name: 'Maria García',
          email: 'mgarcia@condominio.com',
          password: 'password123',
          role: UserRole.Renta,
          photoUrl: 'https://i.postimg.cc/6pQpXGj1/image.png',
          domicilios: { connect: { id: address1_2.id } },
          leaseStartDate: new Date(),
          leaseEndDate: addMonths(new Date(), 12)
      }
  });

  const guardia = await prisma.user.create({
      data: {
          username: 'csanchez',
          name: 'Carlos Sánchez',
          email: 'csanchez@glomar.com',
          password: 'password123',
          role: UserRole.Guardia,
          dailySalary: 550.0,
          photoUrl: 'https://i.postimg.cc/Y0G3SFTT/image.png'
      }
  });

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

  for (const [key, values] of Object.entries(initialLists)) {
    await prisma.list.create({ data: { key, values } });
  }

  // --- Create a ShiftRecord ---
  await prisma.shiftRecord.create({
    data: {
        guardId: guardia.id,
        guardName: guardia.name,
        condominioId: condo1.id,
        condominioName: condo1.name,
        turno: 'Diurno',
        startTime: subDays(new Date(), 1),
        endTime: subDays(new Date(), 1),
    }
  });

  // --- Create a Peticion ---
  await prisma.peticion.create({
      data: {
          title: "Foco fundido en pasillo",
          description: "El foco del pasillo del 3er piso, frente al elevador, está fundido.",
          creatorId: propietario.id,
          creatorName: propietario.name,
          creatorRole: propietario.role,
          condominioId: condo1.id,
          condominioName: condo1.name,
      }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
