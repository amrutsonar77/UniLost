-- =====================================================================
-- UniLost - schema.sql
-- =====================================================================
-- This file is for REFERENCE / documentation only.
-- You do NOT need to run this manually - Spring Boot + Hibernate will
-- automatically create these tables the first time you run the app
-- (because application.properties has spring.jpa.hibernate.ddl-auto=update)
--
-- This script is useful if your professor asks to see the database
-- design, or if you want to create the schema by hand.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS unilost_db;
USE unilost_db;

-- ---------------------------------------------------------------------
-- Table: users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,   -- SHA-256 hashed password
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',  -- STUDENT or ADMIN
    college_name VARCHAR(255)          -- optional, shown on the Profile page
);

-- ---------------------------------------------------------------------
-- Table: lost_items
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lost_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    location VARCHAR(255),
    date DATE,
    image_path VARCHAR(500),
    user_id BIGINT,
    category VARCHAR(50),               -- Electronics, ID Cards, Books, etc.
    status VARCHAR(20) DEFAULT 'PENDING'  -- PENDING, MATCHED, or RECOVERED
);

-- ---------------------------------------------------------------------
-- Table: found_items
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS found_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    location VARCHAR(255),
    date DATE,
    image_path VARCHAR(500),
    user_id BIGINT,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDING'  -- PENDING, MATCHED, or RECOVERED
);

-- ---------------------------------------------------------------------
-- Table: matches  (AI-generated Lost <-> Found matches)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lost_item_id BIGINT,
    found_item_id BIGINT,
    match_score DOUBLE,
    created_at DATETIME
);

-- ---------------------------------------------------------------------
-- Table: conversations  (one thread between two students about one item)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT,
    item_type VARCHAR(10),      -- "LOST" or "FOUND"
    user_one_id BIGINT,
    user_two_id BIGINT,
    created_at DATETIME
);

-- ---------------------------------------------------------------------
-- Table: messages  (chat messages inside a conversation)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT,
    sender_id BIGINT,
    message_text VARCHAR(2000),
    sent_at DATETIME,
    is_read BOOLEAN DEFAULT FALSE
);

-- ---------------------------------------------------------------------
-- Table: claim_requests  (student claiming a found item is theirs)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS claim_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    found_item_id BIGINT,
    claimant_user_id BIGINT,
    reason VARCHAR(1000),
    identifying_detail VARCHAR(1000),
    lost_location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, APPROVED, or REJECTED
    created_at DATETIME
);

-- ---------------------------------------------------------------------
-- Table: notifications  (simple database-based notifications)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    title VARCHAR(255),
    message VARCHAR(1000),
    type VARCHAR(30),   -- AI_MATCH, NEW_MESSAGE, CLAIM_REQUEST, CLAIM_APPROVED, CLAIM_REJECTED
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME
);

-- ---------------------------------------------------------------------
-- Table: otp_tokens  (one-time passwords for email verification & reset)
-- Created automatically by Hibernate (ddl-auto=update).
-- Rows are short-lived; cleaned up by OtpService scheduled task.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_tokens (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,           -- recipient email (lowercase)
    code        VARCHAR(6)   NOT NULL,           -- 6-digit numeric OTP (plain text, short-lived)
    purpose     VARCHAR(10)  NOT NULL,           -- 'REGISTER' or 'RESET'
    expires_at  DATETIME     NOT NULL,           -- now + unilost.otp.expiry-minutes
    created_at  DATETIME     NOT NULL,           -- used for resend rate-limiting
    attempts    INT          NOT NULL DEFAULT 0, -- failed verification attempts (max 5)
    used        TINYINT(1)   NOT NULL DEFAULT 0  -- 1 = already consumed
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON otp_tokens (email, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires       ON otp_tokens (expires_at);

-- ---------------------------------------------------------------------
-- (Optional) Manually promote a student to ADMIN after registering:
-- ---------------------------------------------------------------------
-- UPDATE users SET role = 'ADMIN' WHERE email = 'admin@university.edu';
