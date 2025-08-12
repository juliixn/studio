
export type UserRole = 'Administrador' | 'Propietario' | 'Renta' | 'Guardia' | 'Adm. Condo';

export interface VehicleInfo {
  id: string;
  alias?: string;
  licensePlate: string;
  brand: string;
  color: string;
  type: string;
}

export interface User {
    id: string;
    username: string;
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    photoUrl?: string;
    condominioId?: string; 
    addressId?: string;
    condominioIds?: string[]; // Stored as comma-separated string
    addressIds?: string[]; // Stored as comma-separated string
    vehicles?: VehicleInfo[];
    dailySalary?: number;
    allowRemoteCheckIn?: boolean;
    loanLimit?: number;
    interestRate?: number;
    leaseStartDate?: string;
    leaseEndDate?: string;
    numberOfInhabitants?: number;
    inhabitantNames?: string[]; // Stored as comma-separated string
}

export type GuardMenuSection = 'vehicular' | 'pedestrian' | 'packages' | 'bitacora' | 'peticiones' | 'my_payroll' | 'my_loans' | 'active_exits' | 'reservations' | 'notifications';

export interface Condominio {
    id: string;
    name: string;
    mainAddress: string;
    latitude?: number;
    longitude?: number;
    status: 'Activo' | 'Suspendido';
    guardIds?: string[]; // Stored as comma-separated string
    geofenceRadius?: number;
    guardsRequiredDiurno?: number;
    guardsRequiredNocturno?: number;
    guardMenuSections?: string[]; // Stored as comma-separated string
}

export interface Address {
    id: string;
    fullAddress: string;
    condominioId: string;
}

export interface VehicularRegistration {
    id: string;
    licensePlate: string;
    fullName: string;
    visitorType: string;
    providerType?: string;
    employeeType?: string;
    vehicleType: string;
    vehicleBrand: string;
    vehicleColor: string;
    address: string;
    entryTimestamp: string;
    exitTimestamp?: string;
    condominioId: string;
    condominioName: string;
    visitorIdPhotoUrl?: string;
    vehiclePhotoUrl?: string;
}

export interface PedestrianRegistration {
    id: string;
    fullName: string;
    visitorType: string;
    address: string;
    entryTimestamp: string;
    exitTimestamp?: string;
    condominioId: string;
    condominioName: string;
    visitorIdPhotoUrl?: string;
}

export interface TurnoInfo {
    turno: 'Diurno' | 'Nocturno' | 'Apoyo';
    condominioId: string;
    condominioName: string;
    equipmentIds?: string[]; // Stored as comma-separated string
}

export interface PeticionComment {
    id: string;
    authorId: string;
    authorName: string;
    text: string;
    createdAt: string;
}

export type PeticionStatus = 'Abierta' | 'En Progreso' | 'Cerrada';
export type PeticionCategory = 'General' | 'Financiera' | 'Emergencia';

export interface Peticion {
    id: string;
    title: string;
    description: string;
    creatorId: string;
    creatorName: string;
    creatorRole: UserRole;
    condominioId: string;
    condominioName: string;
    status: PeticionStatus;
    category?: PeticionCategory;
    createdAt: string;
    comments: PeticionComment[];
}

export type BitacoraEntryType = 'Manual' | 'Registro Vehicular' | 'Registro Peatonal' | 'Petición Creada' | 'Alerta Respondida' | 'Incidente Reportado';

export interface BitacoraEntry {
    id: string;
    condominioId: string;
    authorId: string;
    authorName: string;
    createdAt: string;
    updatedAt?: string;
    type: BitacoraEntryType;
    text: string;
    relatedId?: string;
    photos?: string[]; // Stored as comma-separated string
    category?: string;
    latitude?: number;
    longitude?: number;
}

export interface ActiveShift {
    guardId: string;
    guardName: string;
    condominioId: string;
    condominioName: string;
    turno: 'Diurno' | 'Nocturno' | 'Apoyo';
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  description?: string;
  condominioId: string;
}

export type PackageStatus = 'En Recepción' | 'Entregado' | 'Con Daño';

export interface Package {
  id: string;
  recipientAddressId: string;
  recipientAddress: string;
  recipientName: string;
  trackingNumber?: string;
  courierName: string;
  courierCompany: string;
  status: PackageStatus;
  receivedAt: string;
  deliveredAt?: string;
  receivedByGuardId: string;
  receivedByGuardName: string;
  deliveredToName?: string;
  condominioId: string;
  damageNotes?: string;
  deliveryPhotoUrl?: string;
  deliverySignatureUrl?: string;
}

export interface CommonArea {
    id: string;
    name: string;
    description: string;
    capacity: number;
    condominioId: string;
    imageUrl?: string;
    rules?: string;
    cost?: number;
    openingTime?: string;
    closingTime?: string;
}

export type ReservationStatus = 'Pendiente' | 'Aprobada' | 'Rechazada';

export interface Reservation {
    id: string;
    areaId: string;
    areaName: string;
    userId: string;
    userName: string;
    date: string; // YYYY-MM-DD
    startTime: string;
    endTime: string;
    status: ReservationStatus;
    condominioId: string;
    createdAt: string;
}

export interface GuestPass {
  id: string;
  accessType: 'vehicular' | 'pedestrian';
  guestName: string;
  visitorType: string;
  
  passType: 'temporal' | 'permanent';
  validUntil: string | null; // ISO Date string for temporal, null for permanent

  // Vehicular-specific fields (optional)
  licensePlate?: string;
  vehicleType?: string;
  vehicleBrand?: string;
  vehicleColor?: string;

  // Photo evidence
  visitorIdPhotoUrl?: string;
  vehiclePhotoUrl?: string;

  // Association
  residentId: string; // ID of the user who created it
  residentName: string; // Name of the user who created it
  addressId: string;
  address: string; // Full address string
  condominioId: string;
  latitude?: number;
  longitude?: number;

  createdAt: string;
}

export type VisitorNotificationStatus = 'Activa' | 'Utilizada' | 'Cancelada';

export interface VisitorNotification {
  id: string;
  who: string; // Quien(es)
  visitorType: string;
  subject: string; // Asunto
  residentId: string;
  residentName: string;
  addressId: string;
  address: string;
  condominioId: string;
  createdAt: string;
  status: VisitorNotificationStatus;
}

export interface AlertResponse {
    id: string;
    guardId: string;
    guardName: string;
    condominioId: string;
    createdAt: string;
    responseTimeSeconds: number;
    selfiePhotoUrl: string;
    environmentPhotoUrl: string;
    comment: string;
}

export type ShiftIncidentType = 
    | 'Falta' 
    | 'Permiso con Goce' 
    | 'Permiso sin Goce' 
    | 'Enfermedad General' 
    | 'Incapacidad' 
    | 'Vacaciones' 
    | 'Adelanto de Turno' 
    | 'Doble Turno' 
    | 'Penalización';

export interface ShiftRecord {
    id: string;
    guardId: string;
    guardName: string;
    condominioId: string;
    condominioName: string;
    turno: 'Diurno' | 'Nocturno' | 'Apoyo';
    startTime: string;
    endTime?: string;
    equipmentIds?: string[]; // Stored as comma-separated string
    handoverNotes?: string;
    incident?: ShiftIncidentType | null;
}

export interface PlannedShift {
  id: string;
  date: string; // YYYY-MM-DD
  condominioId: string;
  turno: 'Diurno' | 'Nocturno';
  slot: number;
  guardId: string | null; // null if no one is assigned
}


export interface HandoverNote {
    id: string;
    condominioId: string;
    authorId: string;
    authorName: string;
    notes: string;
    createdAt: string;
}

// Types for Finanzas (Payroll)
export interface PayrollAdjustment {
    id: string;
    amount: number;
    reason: string;
}

export interface PayrollDetails {
    [guardId: string]: {
        bonuses: PayrollAdjustment[];
        penalties: PayrollAdjustment[];
    }
}

export interface PayrollData {
    guardId: string;
    name: string;
    dailySalary: number;
    shiftsInPeriod: ShiftRecord[];
    daysWorked: number;
    subtotal: number;
    bonuses: PayrollAdjustment[];
    penalties: PayrollAdjustment[];
    totalBonuses: number;
    totalPenalties: number;
    loanDeduction: number;
    total: number;
}

export interface ArchivedPayroll {
    id: string;
    period: { from: string; to: string };
    payrollData: PayrollData[];
    totals: { subtotal: number; bonuses: number; penalties: number; loanDeductions: number; total: number };
    archivedAt: string;
}

export interface PayrollAnalysisAnomaly {
    guardName: string;
    anomalyDescription: string;
    severity: 'Warning' | 'Critical';
}
  
export interface PayrollAnalysisOutput {
    anomalies: PayrollAnalysisAnomaly[];
    overallStatus: 'Aprobado' | 'Revisión Requerida';
}

// Types for Role Management
export const permissionModules = {
    dashboard: 'Dashboard',
    condominio: 'Condominio',
    usuarios: 'Usuarios',
    directorios: 'Directorio de Usuarios',
    finanzas: 'Finanzas',
    registros: 'Registros',
    bitacora: 'Bitácora',
    asistencia: 'Asistencia',
    comunicados: 'Comunicados',
    peticiones: 'Peticiones',
    notificaciones: 'Notificaciones',
    pases_invitado: 'Pases de Invitado',
    paqueteria: 'Paquetería',
    configuracion: 'Configuración General',
    listas: 'Listas',
    emergencia: 'Emergencia',
    roles: 'Roles y Permisos',
    activos: 'Activos'
};

export type PermissionModuleId = keyof typeof permissionModules;

export interface RolePermission {
    roleName: string;
    permissions: {
        [key in PermissionModuleId]?: boolean;
    };
    isDeletable: boolean;
}

// Types for Resident Fees
export interface Transaction {
    id: string;
    date: string;
    type: 'charge' | 'payment';
    concept: string;
    amount: number;
}

export interface ResidentAccount {
    residentId: string;
    residentName: string;
    address: string;
    condominioId: string;
    condominioName: string;
    balance: number;
    transactions: Transaction[];
}

export type LoanStatus = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Pagado';

export interface Loan {
    id: string;
    guardId: string;
    guardName: string;
    amount: number;
    reason: string;
    interestRate: number; // Stored as percentage, e.g., 5 for 5%
    totalOwed: number;
    balance: number;
    status: LoanStatus;
    requestedAt: string;
    approvedAt?: string;
    payments: string; // Stored as JSON string
}

export interface Comunicado {
  id: string;
  subject: string;
  message: string;
  target: 'all' | string; // 'all' or a condominioId
  targetName: string;
  channels: ('Push' | 'Email')[];
  createdAt: string;
}

export interface PanicAlert {
    id: string;
    condominioId: string;
    guardId: string;
    guardName: string;
    createdAt: string;
}

// --- New Feature Definitions ---

export type WorkOrderStatus = 'Pendiente' | 'Asignada' | 'En Progreso' | 'Completada' | 'Cancelada';

export interface WorkOrder {
    id: string;
    title: string;
    description: string;
    peticionId?: string; // Link to the original petition
    condominioId: string;
    address: string;
    status: WorkOrderStatus;
    assignedTo?: string; // User ID of maintenance personnel
    createdAt: string;
    completedAt?: string;
    cost?: number;
}

export interface Asset {
    id: string;
    name: string;
    category: string; // e.g., 'Seguridad', 'Plomería', 'Eléctrico'
    location: string;
    condominioId: string;
    purchaseDate?: string;
    lastMaintenanceDate?: string;
    nextMaintenanceDate?: string;
    status: 'Operativo' | 'En Mantenimiento' | 'Requiere Reemplazo';
}

export interface SurveyOption {
    id: string;
    text: string;
    votes: number;
}

export interface Survey {
    id: string;
    title: string;
    description: string;
    condominioId: 'all' | string;
    options: SurveyOption[];
    createdAt: string;
    closesAt: string;
    status: 'Abierta' | 'Cerrada';
}

export interface CommunityEvent {
    id: string;
    title: string;
    description: string;
    condominioId: 'all' | string;
    start: string; // ISO Date string
    end: string; // ISO Date string
    isAllDay: boolean;
    location?: string; // e.g., 'Salón de Eventos'
}


export interface ChatMessage {
    id: string;
    authorId: string;
    authorName: string;
    text: string;
    createdAt: string;
}

export interface DirectMessage extends ChatMessage {
    conversationId: string;
    recipientId: string;
}

export interface Conversation {
    id: string;
    participantIds: string[]; // Stored as comma-separated string
    participantNames: string[]; // Stored as comma-separated string
    messages: DirectMessage[];
    lastMessageAt: string;
}
