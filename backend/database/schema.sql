CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    team1 VARCHAR(100) NOT NULL,
    team2 VARCHAR(100) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    match_date TIMESTAMP NOT NULL,
    total_seats INTEGER NOT NULL CHECK (total_seats >= 500 AND total_seats <= 50000),
    available_seats INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    seat_number INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'available',
    UNIQUE(match_id, seat_number)
);

CREATE TABLE queue_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    match_id INTEGER NOT NULL REFERENCES matches(id),
    status VARCHAR(30) DEFAULT 'waiting',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    match_id INTEGER NOT NULL REFERENCES matches(id),
    seat_id INTEGER NOT NULL REFERENCES seats(id),
    status VARCHAR(30) DEFAULT 'reserved',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(match_id, seat_id)
);
