-- Limpieza completa de tablas existentes para asegurar una inicialización limpia.
-- El uso de 'CASCADE' elimina también las dependencias (como claves foráneas).
DROP TABLE IF EXISTS public.packages CASCADE;
DROP TABLE IF EXISTS public.vehicular_registrations CASCADE;
DROP TABLE IF EXISTS public.pedestrian_registrations CASCADE;
DROP TABLE IF EXISTS public.guest_passes CASCADE;
DROP TABLE IF EXISTS public.peticiones CASCADE;
DROP TABLE IF EXISTS public.bitacora_entries CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.condominios CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- Creación de la tabla para Condominios
CREATE TABLE public.condominios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    main_address TEXT NOT NULL,
    status TEXT DEFAULT 'Activo' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;

-- Creación de la tabla para Direcciones/Domicilios
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_address TEXT NOT NULL,
    condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Creación de la tabla de Perfiles de Usuario, vinculada a auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    condominio_id UUID REFERENCES public.condominios(id),
    address_id UUID REFERENCES public.addresses(id),
    condominio_ids UUID[],
    address_ids UUID[],
    photo_url TEXT,
    requires_password_change BOOLEAN DEFAULT TRUE
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Creación de la tabla para Peticiones
CREATE TABLE public.peticiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    creator_id UUID REFERENCES public.profiles(id),
    creator_name TEXT NOT NULL,
    creator_role TEXT NOT NULL,
    condominio_id UUID REFERENCES public.condominios(id),
    condominio_name TEXT NOT NULL,
    status TEXT DEFAULT 'Abierta' NOT NULL,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    comments JSONB[] DEFAULT '{}'
);
ALTER TABLE public.peticiones ENABLE ROW LEVEL SECURITY;

-- Creación de la tabla para Bitácora
CREATE TABLE public.bitacora_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condominio_id UUID REFERENCES public.condominios(id),
    author_id UUID REFERENCES public.profiles(id),
    author_name TEXT NOT NULL,
    type TEXT NOT NULL,
    text TEXT NOT NULL,
    related_id UUID,
    photos TEXT[],
    category TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ
);
ALTER TABLE public.bitacora_entries ENABLE ROW LEVEL SECURITY;

-- Creación de la tabla para Paquetería
CREATE TABLE public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_address_id UUID REFERENCES public.addresses(id),
    recipient_address TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    courier_name TEXT NOT NULL,
    courier_company TEXT NOT NULL,
    status TEXT DEFAULT 'En Recepción' NOT NULL,
    received_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    delivered_at TIMESTAMPTZ,
    received_by_guard_id UUID REFERENCES public.profiles(id),
    received_by_guard_name TEXT NOT NULL,
    delivered_to_name TEXT,
    condominio_id UUID REFERENCES public.condominios(id),
    damage_notes TEXT,
    delivery_photo_url TEXT,
    delivery_signature_url TEXT
);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Creación de la tabla para Pases de Invitado
CREATE TABLE public.guest_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_type TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    visitor_type TEXT NOT NULL,
    pass_type TEXT NOT NULL,
    valid_until TIMESTAMPTZ,
    license_plate TEXT,
    vehicle_type TEXT,
    vehicle_brand TEXT,
    vehicle_color TEXT,
    visitor_id_photo_url TEXT,
    vehicle_photo_url TEXT,
    resident_id UUID REFERENCES public.profiles(id),
    resident_name TEXT NOT NULL,
    address_id UUID REFERENCES public.addresses(id),
    address TEXT NOT NULL,
    condominio_id UUID REFERENCES public.condominios(id),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.guest_passes ENABLE ROW LEVEL SECURITY;

-- Creación de la tabla para Registros Vehiculares
CREATE TABLE public.vehicular_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_plate TEXT NOT NULL,
    full_name TEXT NOT NULL,
    visitor_type TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    vehicle_brand TEXT NOT NULL,
    vehicle_color TEXT NOT NULL,
    address TEXT NOT NULL,
    entry_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
    exit_timestamp TIMESTAMPTZ,
    condominio_id UUID REFERENCES public.condominios(id),
    condominio_name TEXT NOT NULL,
    visitor_id_photo_url TEXT,
    vehicle_photo_url TEXT
);
ALTER TABLE public.vehicular_registrations ENABLE ROW LEVEL SECURITY;

-- Creación de la tabla para Registros Peatonales
CREATE TABLE public.pedestrian_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    visitor_type TEXT NOT NULL,
    address TEXT NOT NULL,
    entry_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
    exit_timestamp TIMESTAMPTZ,
    condominio_id UUID REFERENCES public.condominios(id),
    condominio_name TEXT NOT NULL,
    visitor_id_photo_url TEXT
);
ALTER TABLE public.pedestrian_registrations ENABLE ROW LEVEL SECURITY;


-- INSERCIÓN DE DATOS DE EJEMPLO

-- Insertar Condominios
INSERT INTO public.condominios (id, name, main_address, status) VALUES
('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', 'Residencial Los Robles', 'Av. de los Robles 123, Ciudad', 'Activo'),
('2a8c5efd-ccgf-3b1c-8a4c-bc7cfccb3afc', 'Condominio El Manantial', 'Calle del Agua 45, Pueblo', 'Activo');

-- Insertar Direcciones y asociarlas a los condominios
INSERT INTO public.addresses (id, full_address, condominio_id) VALUES
('add1', 'Casa 101', '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'),
('add2', 'Casa 102', '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'),
('add3', 'Depto 201', '2a8c5efd-ccgf-3b1c-8a4c-bc7cfccb3afc');

-- Insertar Usuarios en el sistema de autenticación de Supabase
-- Las contraseñas para todos son 'password123', excepto para el admin que es 'admin'
INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
    ('8d2f149a-2de2-4c38-8637-29a39a2b53c7', 'authenticated', 'authenticated', 'admin@glomar.com', crypt('admin', gen_salt('bf')), now(), '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"name": "Admin Glomar", "role": "Administrador"}', now(), now()),
    ('9e3f149a-3de3-5c49-9748-30a40a3c64d8', 'authenticated', 'authenticated', 'admcondo@glomar.com', crypt('password123', gen_salt('bf')), now(), '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"name": "Adm Condo Robles", "role": "Adm. Condo", "condominio_id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed"}', now(), now()),
    ('ae4g250a-4ef4-6d50-0859-41b51b4d75e9', 'authenticated', 'authenticated', 'jperez@condominio.com', crypt('password123', gen_salt('bf')), now(), '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"name": "Juan Perez", "role": "Propietario", "address_id": "add1"}', now(), now()),
    ('bf5h361b-5fg5-7e61-1960-52c62c5e86f0', 'authenticated', 'authenticated', 'mgarcia@condominio.com', crypt('password123', gen_salt('bf')), now(), '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"name": "Maria Garcia", "role": "Renta", "address_id": "add2"}', now(), now()),
    ('cg6i472c-6gh6-8f72-2071-63d73d6f97g1', 'authenticated', 'authenticated', 'csanchez@glomar.com', crypt('password123', gen_salt('bf')), now(), '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"name": "Carlos Sanchez", "role": "Guardia", "condominio_id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed"}', now(), now());

-- Insertar perfiles para cada usuario, vinculándolos con la tabla de auth.users
INSERT INTO public.profiles (id, name, role, condominio_id, address_id, condominio_ids, address_ids, photo_url, requires_password_change)
VALUES
    ('8d2f149a-2de2-4c38-8637-29a39a2b53c7', 'Admin Glomar', 'Administrador', NULL, NULL, NULL, NULL, 'https://placehold.co/100x100.png', true),
    ('9e3f149a-3de3-5c49-9748-30a40a3c64d8', 'Adm Condo Robles', 'Adm. Condo', '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', NULL, NULL, NULL, 'https://placehold.co/100x100.png', true),
    ('ae4g250a-4ef4-6d50-0859-41b51b4d75e9', 'Juan Perez', 'Propietario', NULL, 'add1', '{"1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed"}', '{"add1"}', 'https://placehold.co/100x100.png', true),
    ('bf5h361b-5fg5-7e61-1960-52c62c5e86f0', 'Maria Garcia', 'Renta', '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', 'add2', NULL, NULL, 'https://placehold.co/100x100.png', true),
    ('cg6i472c-6gh6-8f72-2071-63d73d6f97g1', 'Carlos Sanchez', 'Guardia', '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', NULL, NULL, NULL, 'https://placehold.co/100x100.png', true);

-- Insertar una petición de ejemplo
INSERT INTO public.peticiones (title, description, creator_id, creator_name, creator_role, condominio_id, condominio_name, status) VALUES
('Luz quemada en pasillo', 'La luz del pasillo del piso 3, torre A, está quemada desde hace una semana.', 'ae4g250a-4ef4-6d50-0859-41b51b4d75e9', 'Juan Perez', 'Propietario', '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', 'Residencial Los Robles', 'Abierta');

-- Insertar una entrada de bitácora de ejemplo
INSERT INTO public.bitacora_entries (condominio_id, author_id, author_name, type, text) VALUES
('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', 'cg6i472c-6gh6-8f72-2071-63d73d6f97g1', 'Carlos Sanchez', 'Manual', 'Se realizó rondín de rutina a las 22:00 hrs. Todo en orden, sin novedades.');

-- Insertar un paquete de ejemplo
INSERT INTO public.packages (recipient_address_id, recipient_address, recipient_name, courier_name, courier_company, received_by_guard_id, received_by_guard_name, condominio_id) VALUES
('add1', 'Casa 101', 'Juan Perez', 'Mario Bros', 'Mercado Libre', 'cg6i472c-6gh6-8f72-2071-63d73d6f97g1', 'Carlos Sanchez', '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed');
