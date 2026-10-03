-- Fair Drop test data
-- Creates two cricket-ticket events:
-- Event 1: 10 tickets
-- Event 2: 500 tickets

INSERT INTO events (name, total_seats)
VALUES
    ('Fair Drop Test Event', 10),
    ('Fair Drop 500 Cricket Tickets Stress Test', 500)
ON CONFLICT DO NOTHING;


-- Create 10 seats for Event 1
INSERT INTO seats (event_id, seat_number, status)
SELECT
    1,
    'A' || LPAD(generate_series::text, 3, '0'),
    'AVAILABLE'
FROM generate_series(1, 10)
ON CONFLICT DO NOTHING;


-- Create 500 seats for Event 2
INSERT INTO seats (event_id, seat_number, status)
SELECT
    2,
    'A' || LPAD(generate_series::text, 3, '0'),
    'AVAILABLE'
FROM generate_series(1, 500)
ON CONFLICT DO NOTHING;


-- Protect against duplicate seat numbers within an event
CREATE UNIQUE INDEX IF NOT EXISTS unique_event_seat_number
ON seats(event_id, seat_number);


-- Protect against multiple active reservations
-- for the same user in the same event
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_user_reservation
ON reservations(event_id, user_id)
WHERE status = 'RESERVED';