"""Add user roles, phone, names; seed admin

Revision ID: 002
Revises: 001
Create Date: 2025-02-25

"""
from alembic import op
import sqlalchemy as sa
import uuid
import bcrypt

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def _gen_uuid():
    return str(uuid.uuid4())


def upgrade():
    op.add_column("users", sa.Column("username", sa.String(64), nullable=True))
    op.add_column("users", sa.Column("first_name", sa.String(128), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(128), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(20), nullable=True))
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)

    conn = op.get_bind()
    # Ensure 5 roles exist: Admin, Technical, Student, Parent, Teacher
    for name in ("Admin", "Technical", "Student", "Parent", "Teacher"):
        r = conn.execute(sa.text("SELECT id FROM roles WHERE name = :n"), {"n": name})
        if r.fetchone() is None:
            conn.execute(sa.text("INSERT INTO roles (name) VALUES (:n)"), {"n": name})

    # Get Admin role id
    r = conn.execute(sa.text("SELECT id FROM roles WHERE name = 'Admin' LIMIT 1"))
    row = r.fetchone()
    admin_role_id = row[0] if row else 1

    # Create admin user if not exists (username=admin, password=admin)
    r = conn.execute(sa.text("SELECT id FROM users WHERE username = 'admin' LIMIT 1"))
    if r.fetchone() is None:
        admin_id = _gen_uuid()
        pw_hash = bcrypt.hashpw(b"admin", bcrypt.gensalt()).decode()
        conn.execute(
            sa.text("""
                INSERT INTO users (id, username, email, password_hash, full_name, role_id)
                VALUES (:id, 'admin', 'admin@system.local', :pw, 'مدیر سیستم', :rid)
            """),
            {"id": admin_id, "pw": pw_hash, "rid": admin_role_id},
        )


def downgrade():
    op.drop_index("ix_users_phone", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_column("users", "phone")
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
    op.drop_column("users", "username")
