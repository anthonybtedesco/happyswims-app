-- Address table
CREATE TABLE IF NOT EXISTS address (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address_line TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL
);

-- Client table
CREATE TABLE IF NOT EXISTS client (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    home_address_id UUID NOT NULL REFERENCES address(id)
);

-- Instructor table
CREATE TABLE IF NOT EXISTS instructor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    home_address_id UUID NOT NULL REFERENCES address(id)
);

-- Availability table
CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    instructor_id UUID NOT NULL REFERENCES instructor(id),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    timerange TSRANGE NOT NULL,
    color TEXT NOT NULL
);

-- Booking table
CREATE TABLE IF NOT EXISTS booking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    pool_address_id UUID NOT NULL REFERENCES address(id),
    client_id UUID NOT NULL REFERENCES client(id),
    instructor_id UUID NOT NULL REFERENCES instructor(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL,
    recurrence_weeks INTEGER NOT NULL,
    calendar_event_id TEXT,
    google_event_link TEXT,
    user_id UUID,
    booking_status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    status TEXT DEFAULT 'active'
);
