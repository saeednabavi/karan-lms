"""Unify roles, add audience_type, extend assets, progress, exams

Revision ID: 003
Revises: 002
Create Date: 2025-07-01
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None

CANONICAL_ROLES = ("Admin", "Technical", "Teacher", "Pupil", "Student", "Parent")

ROLE_MAP = {
    "SuperAdmin": "Admin",
    "ContentManager": "Technical",
    "Instructor": "Teacher",
    "Support": "Technical",
    "Finance": "Admin",
    "Affiliate": "Student",
}


def upgrade():
    conn = op.get_bind()

    for name in CANONICAL_ROLES:
        r = conn.execute(sa.text("SELECT id FROM roles WHERE name = :n"), {"n": name})
        if r.fetchone() is None:
            conn.execute(sa.text("INSERT INTO roles (name) VALUES (:n)"), {"n": name})

    for old_name, new_name in ROLE_MAP.items():
        old = conn.execute(sa.text("SELECT id FROM roles WHERE name = :n"), {"n": old_name}).fetchone()
        new = conn.execute(sa.text("SELECT id FROM roles WHERE name = :n"), {"n": new_name}).fetchone()
        if old and new:
            conn.execute(
                sa.text("UPDATE users SET role_id = :new_id WHERE role_id = :old_id"),
                {"new_id": new[0], "old_id": old[0]},
            )

    op.add_column("courses", sa.Column("audience_type", sa.String(32), server_default="all", nullable=True))

    op.add_column("assets", sa.Column("title", sa.String(255), nullable=True))
    op.add_column("assets", sa.Column("source_type", sa.String(32), server_default="upload", nullable=True))
    op.add_column("assets", sa.Column("external_url", sa.String(500), nullable=True))
    with op.batch_alter_table("assets") as batch:
        batch.alter_column("file_path", existing_type=sa.String(500), nullable=True)

    op.create_table(
        "lesson_progress",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("lesson_id", sa.String(36), sa.ForeignKey("lessons.id"), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("last_position_sec", sa.Integer(), server_default="0"),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("user_id", "lesson_id", name="uq_progress_user_lesson"),
    )

    op.create_table(
        "parent_pupils",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("parent_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("pupil_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("parent_id", "pupil_id", name="uq_parent_pupil"),
    )

    op.add_column("exams", sa.Column("teacher_id", sa.String(36), sa.ForeignKey("users.id"), nullable=True))

    op.create_table(
        "questions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("exam_id", sa.String(36), sa.ForeignKey("exams.id"), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("options", sa.JSON(), nullable=False),
        sa.Column("correct_index", sa.Integer(), server_default="0"),
        sa.Column("order_num", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "exam_attempts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("exam_id", sa.String(36), sa.ForeignKey("exams.id"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("score", sa.Float(), server_default="0"),
        sa.Column("total", sa.Integer(), server_default="0"),
        sa.Column("answers", sa.JSON(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table("exam_attempts")
    op.drop_table("questions")
    op.drop_column("exams", "teacher_id")
    op.drop_table("parent_pupils")
    op.drop_table("lesson_progress")
    with op.batch_alter_table("assets") as batch:
        batch.alter_column("file_path", existing_type=sa.String(500), nullable=False)
    op.drop_column("assets", "external_url")
    op.drop_column("assets", "source_type")
    op.drop_column("assets", "title")
    op.drop_column("courses", "audience_type")
