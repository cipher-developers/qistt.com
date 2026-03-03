-- Seed default tenant and admin user
-- Email: admin@kistly.local
-- Password: admin123
-- Hash generated with: bcryptjs.hashSync('admin123', 12)

-- Insert default tenant
INSERT INTO "Tenant" (id, name, subdomain, "ownerEmail", status, "updatedAt")
VALUES (
  'default-tenant-id',
  'Default Tenant',
  'default',
  'admin@kistly.local',
  'active',
  NOW()
)
ON CONFLICT (subdomain) DO NOTHING;

-- Insert admin user with bcryptjs hashed password for 'admin123'
-- Hash: $2a$12$8IlHWQdV.RQkJ8/W7VQKvOqq4LJmJZTuABOiqVo0GlCLQhG9zPPwC
INSERT INTO "User" (id, email, password, "firstName", "lastName", role, "tenantId", "updatedAt")
SELECT
  'default-admin-id',
  'admin@kistly.local',
  '$2a$12$8IlHWQdV.RQkJ8/W7VQKvOqq4LJmJZTuABOiqVo0GlCLQhG9zPPwC',
  'Admin',
  'User',
  'OWNER',
  id,
  NOW()
FROM "Tenant"
WHERE subdomain = 'default'
ON CONFLICT (email) DO NOTHING;
