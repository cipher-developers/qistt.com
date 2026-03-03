-- Seed default tenant and admin user
-- Password: admin123 (hashed with bcryptjs)
-- Hash generated with: bcryptjs.hashSync('admin123', 12)

-- Insert default tenant
INSERT INTO "Tenant" (id, name, slug, email, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Default Tenant',
  'default',
  'admin@kistly.local',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Insert admin user with bcryptjs hashed password for 'admin123'
-- Hash: $2a$12$...
INSERT INTO "User" (id, email, name, "passwordHash", role, "tenantId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  'admin@kistly.local',
  'Admin User',
  '$2a$12$8IlHWQdV.RQkJ8/W7VQKvOqq4LJmJZTuABOiqVo0GlCLQhG9zPPwC',
  'ADMIN',
  id,
  NOW(),
  NOW()
FROM "Tenant"
WHERE slug = 'default'
ON CONFLICT (email) DO NOTHING;
