-- FINEKO Database Seed Script
-- This script creates the required tables and populates them with mock data.

-- 1. Core Tables

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    tg_user_id VARCHAR(255) UNIQUE NOT NULL,
    tg_username VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id VARCHAR(255) REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id),
    company_id VARCHAR(255) REFERENCES companies(id) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);


-- 2. Organizational Structure Tables

CREATE TABLE IF NOT EXISTS divisions (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(255) REFERENCES companies(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "order" INTEGER
);

CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(255) PRIMARY KEY,
    division_id VARCHAR(255) REFERENCES divisions(id) NOT NULL,
    manager_id VARCHAR(255) REFERENCES employees(id),
    name VARCHAR(255) NOT NULL,
    ckp TEXT
);

CREATE TABLE IF NOT EXISTS department_employees (
    department_id VARCHAR(255) REFERENCES departments(id) ON DELETE CASCADE,
    employee_id VARCHAR(255) REFERENCES employees(id) ON DELETE CASCADE,
    PRIMARY KEY (department_id, employee_id)
);


-- Mock Data Insertion

BEGIN;

-- Create a mock user, company, and employees
INSERT INTO users (id, tg_user_id, tg_username, first_name, last_name, photo_url) VALUES
('user-1', '12345', 'owner', 'Oleksandr', 'Matsuk', 'https://picsum.photos/100/100?random=1'),
('user-2', '54321', 'employee1', 'Petro', 'Ivanenko', 'https://picsum.photos/100/100?random=4'),
('user-3', '67890', 'employee2', 'Maria', 'Sydorenko', 'https://picsum.photos/100/100?random=2');

INSERT INTO companies (id, name, owner_id) VALUES
('company-1', 'Fineko Development', 'user-1');

INSERT INTO employees (id, user_id, company_id, first_name, last_name, status) VALUES
('emp-1', 'user-1', 'company-1', 'Oleksandr', 'Matsuk', 'active'),
('emp-2', 'user-2', 'company-1', 'Petro', 'Ivanenko', 'active'),
('emp-3', 'user-3', 'company-1', 'Maria', 'Sydorenko', 'active'),
('emp-4', null, 'company-1', 'Olena', 'Kovalchuk', 'active'),
('emp-5', null, 'company-1', 'Andriy', 'Bondarenko', 'active');


-- Insert Org Structure Data
INSERT INTO divisions (id, company_id, name, description, "order") VALUES
('div-1', 'company-1', '7. Адміністративне відділення', 'Керування, розвиток, PR', 1),
('div-2', 'company-1', '1. Відділення побудови', 'Побудова та адміністрування', 2),
('div-3', 'company-1', '2. Відділення розповсюдження', 'Маркетинг, Продажі', 3),
('div-4', 'company-1', '3. Фінансове відділення', 'Фінанси, Бухгалтерія', 4),
('div-5', 'company-1', '4. Технічне відділення', 'Виробництво та надання послуг', 5),
('div-6', 'company-1', '5. Відділення кваліфікації', 'Контроль якості та навчання', 6),
('div-7', 'company-1', '6. Відділення по роботі з публікою', 'Робота з персоналом та клієнтами', 7);

INSERT INTO departments (id, division_id, manager_id, name, ckp) VALUES
('dept-hr', 'div-7', 'emp-4', 'Відділ персоналу', 'Продуктивні співробітники, найняті та введені на посаду'),
('dept-it', 'div-2', 'emp-5', 'IT Відділ', 'Стабільно працююча IT-інфраструктура'),
('dept-finance', 'div-4', 'emp-5', 'Бухгалтерія', 'Вчасно подана звітність та сплачені податки');

-- Note: Sections are simplified into departments for this relational schema example.
-- If sections are a hard requirement, a `sections` table would be needed, linked to departments.

INSERT INTO department_employees (department_id, employee_id) VALUES
('dept-hr', 'emp-4'),
('dept-it', 'emp-5');


-- Placeholder for other tables (Tasks, Results, etc.)
-- CREATE TABLE IF NOT EXISTS results (...)
-- CREATE TABLE IF NOT EXISTS tasks (...)
-- ... and so on

COMMIT;
