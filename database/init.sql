-- CampusIQ AI Database Initialization
CREATE DATABASE IF NOT EXISTS campusiq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campusiq;

-- Grant permissions
GRANT ALL PRIVILEGES ON campusiq.* TO 'campusiq_user'@'%';
FLUSH PRIVILEGES;
