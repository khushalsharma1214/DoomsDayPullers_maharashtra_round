-- Fair Drop test data
-- Creates two cricket-ticket events:
-- Event 1: 10 tickets
-- Event 2: 500 tickets

INSERT INTO events (name, total_seats)
SELECT
    'Fair Drop Test Event',
    10
WHERE NOT EXISTS (
    SELECT 1
    FROM events
    WHERE name = 'Fair Drop Test Event'
);

INSERT INTO events (name, total_seats)
SELECT
    'Fair Drop 500 Cricket Tickets Stress Test',
    500
WHERE NOT EXISTS (
    SELECT 1
    FROM events
    WHERE name = 'Fair Drop 500 Cricket Tickets Stress Test'
);


-- Create seats for the 10-ticket test event
INSERT INTO seats (event_id, seat_number, status)
SELECT
    e.id,
    'A' || LPAD(gs::text, 3, '0'),
    'AVAILABLE'
FROM events e
CROSS JOIN generate_series(1, 10) AS gs
WHERE e.name = 'Fair Drop Test Event'
AND NOT EXISTS (
    SELECT 1
    FROM seats s
    WHERE s.event_id = e.id
    AND s.seat_number = 'A' || LPAD(gs::text, 3, '0')
);


-- Create seats for the 500-ticket stress-test event
INSERT INTO seats (event_id, seat_number, status)
SELECT
    e.id,
    'A' || LPAD(gs::text, 3, '0'),
    'AVAILABLE'
FROM events e
CROSS JOIN generate_series(1, 500) AS gs
WHERE e.name = 'Fair Drop 500 Cricket Tickets Stress Test'
AND NOT EXISTS (
    SELECT 1
    FROM seats s
    WHERE s.event_id = e.id
    AND s.seat_number = 'A' || LPAD(gs::text, 3, '0')
);


-- Protect against duplicate seat numbers within an event
CREATE UNIQUE INDEX IF NOT EXISTS unique_event_seat_number
ON seats(event_id, seat_number);


-- Protect against multiple active reservations
-- for the same user in the same event
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_user_reservation
ON reservations(event_id, user_id)
WHERE status = 'RESERVED';