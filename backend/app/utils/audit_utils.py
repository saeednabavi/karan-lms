from flask import request

from ..extensions import db
from ..models import AuditLog


def log_audit(user_id, action, resource_type=None, resource_id=None, details=None):
    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        details=details,
        ip_address=request.remote_addr if request else None,
    )
    db.session.add(entry)
    db.session.commit()
