CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    contact VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    phone VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    documents TEXT NOT NULL,
    earnings_count INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    deadline TIMESTAMP NOT NULL,
    quantity INTEGER NOT NULL,
    units VARCHAR NOT NULL,
    tags TEXT NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'published',
    origin_erp VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    request_id INTEGER NOT NULL REFERENCES requests(id),
    price DOUBLE PRECISION NOT NULL,
    delivery_time VARCHAR NOT NULL,
    conditions TEXT NOT NULL,
    attachments TEXT NOT NULL,
    photo TEXT,
    status VARCHAR NOT NULL DEFAULT 'sent',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_config (
    id SERIAL PRIMARY KEY,
    smtp_host VARCHAR NOT NULL,
    smtp_port INTEGER NOT NULL,
    smtp_user VARCHAR NOT NULL,
    smtp_password VARCHAR NOT NULL,
    smtp_from VARCHAR NOT NULL
);

-- Seed some data
INSERT INTO requests (title, description, deadline, quantity, units, tags, origin_erp, status)
VALUES ('Laptop Purchase', 'Need 10 MacBook Pros', '2025-12-31 00:00:00', 10, 'units', 'tech,hardware', 'ERP-001', 'published');

INSERT INTO email_config (id, smtp_host, smtp_port, smtp_user, smtp_password, smtp_from)
VALUES (1, 'smtp.example.com', 587, 'user', 'pass', 'admin@portal.com')
ON CONFLICT (id) DO NOTHING;
