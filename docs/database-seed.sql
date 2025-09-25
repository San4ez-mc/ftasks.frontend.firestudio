-- This file contains SQL statements to create the necessary tables
-- and seed them with initial mock data, reflecting the structure
-- in database-schema.md and data from the mock files.

-- 1. Core Tables

-- users table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    tg_user_id VARCHAR(255) UNIQUE NOT NULL,
    telegram_username VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    photo_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- companies table
CREATE TABLE companies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id VARCHAR(255) REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- employees table
CREATE TABLE employees (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id),
    company_id VARCHAR(255) REFERENCES companies(id) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

-- 2. Task Management Tables

-- results table
CREATE TABLE results (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(255) REFERENCES companies(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50),
    completed BOOLEAN DEFAULT false,
    deadline DATE,
    assignee_id VARCHAR(255) REFERENCES employees(id),
    reporter_id VARCHAR(255) REFERENCES employees(id),
    expected_result TEXT,
    access_list JSONB
);

-- sub_results table
CREATE TABLE sub_results (
    id VARCHAR(255) PRIMARY KEY,
    result_id VARCHAR(255) REFERENCES results(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT false,
    "order" INTEGER
);

-- tasks table
CREATE TABLE tasks (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(255) REFERENCES companies(id) NOT NULL,
    result_id VARCHAR(255) REFERENCES results(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(50),
    type VARCHAR(50),
    expected_time INTEGER,
    actual_time INTEGER,
    expected_result TEXT,
    actual_result TEXT,
    assignee_id VARCHAR(255) REFERENCES employees(id),
    reporter_id VARCHAR(255) REFERENCES employees(id)
);

-- 3. Organizational Structure Tables

-- divisions table
CREATE TABLE divisions (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(255) REFERENCES companies(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "order" INTEGER
);

-- departments table
CREATE TABLE departments (
    id VARCHAR(255) PRIMARY KEY,
    division_id VARCHAR(255) REFERENCES divisions(id) NOT NULL,
    manager_id VARCHAR(255) REFERENCES employees(id),
    name VARCHAR(255) NOT NULL,
    ckp TEXT
);

-- department_employees table
CREATE TABLE department_employees (
    department_id VARCHAR(255) REFERENCES departments(id) NOT NULL,
    employee_id VARCHAR(255) REFERENCES employees(id) NOT NULL,
    PRIMARY KEY (department_id, employee_id)
);


-- Initial Data Seeding

-- Assuming a single user and company for simplicity
INSERT INTO users (id, tg_user_id, telegram_username, first_name, last_name, photo_url) VALUES
('user-1', '12345678', 'testuser', 'Тестовий', 'Користувач', 'https://example.com/avatar.jpg');

INSERT INTO companies (id, name, owner_id) VALUES
('company-1', 'Моя Компанія', 'user-1');

-- Seed employees from mock data
INSERT INTO employees (id, user_id, company_id, first_name, last_name, status) VALUES
('emp-1', 'user-1', 'company-1', 'Петро', 'Іваненко', 'active'),
('emp-2', null, 'company-1', 'Марія', 'Сидоренко', 'active'),
('emp-3', null, 'company-1', 'Олена', 'Ковальчук', 'active'),
('emp-4', null, 'company-1', 'Іван', 'Петренко', 'active'),
('emp-5', null, 'company-1', 'Андрій', 'Бондаренко', 'active'),
('emp-6', null, 'company-1', 'Сергій', 'Вовк', 'active'),
('emp-7', null, 'company-1', 'Юлія', 'Лисенко', 'active');

-- Seed divisions from mock data
INSERT INTO divisions (id, company_id, name, description, "order") VALUES
('div-1', 'company-1', '7. Адміністративне відділення', 'Керування, розвиток, PR', 1),
('div-2', 'company-1', '1. Відділення побудови', 'Побудова та адміністрування', 2),
('div-3', 'company-1', '2. Відділення розповсюдження', 'Маркетинг, Продажі', 3),
('div-4', 'company-1', '3. Фінансове відділення', 'Фінанси, Бухгалтерія', 4),
('div-5', 'company-1', '4. Технічне відділення', 'Виробництво та надання послуг', 5),
('div-6', 'company-1', '5. Відділення кваліфікації', 'Контроль якості та навчання', 6),
('div-7', 'company-1', '6. Відділення по роботі з публікою', 'Робота з персоналом та клієнтами', 7);

-- Seed departments from mock data
-- Note: 'sections' from the original mock are flattened for this relational schema.
-- A separate 'sections' table could be created for more complexity.
INSERT INTO departments (id, division_id, manager_id, name, ckp) VALUES
('dept-hr', 'div-7', 'emp-3', 'Відділ персоналу', 'Продуктивні співробітники, найняті та введені на посаду'),
('dept-it', 'div-2', 'emp-6', 'IT Відділ', 'Стабільно працююча IT-інфраструктура'),
('dept-finance', 'div-4', 'emp-5', 'Бухгалтерія', 'Вчасно подана звітність та сплачені податки');

-- Seed department_employees links based on mock 'sections'
-- This is a simplified representation.
INSERT INTO department_employees (department_id, employee_id) VALUES
('dept-hr', 'emp-3'), -- Manager
('dept-hr', 'emp-7'),
('dept-it', 'emp-6'), -- Manager
('dept-finance', 'emp-5'); -- Manager