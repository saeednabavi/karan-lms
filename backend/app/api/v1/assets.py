import os

from flask import Blueprint, send_file, redirect
from flask_jwt_extended import get_jwt_identity, jwt_required

from ...models import Asset
from ...utils.response import error_response
from ...policies.rbac import can_access_asset

assets_bp = Blueprint("assets", __name__)


@assets_bp.route("/<id>/download", methods=["GET"])
@jwt_required()
def download_asset(id):
    asset = Asset.query.get(id)
    if not asset:
        return error_response("NOT_FOUND", "Asset not found"), 404
    user_id = get_jwt_identity()
    if not can_access_asset(user_id, asset):
        return error_response("FORBIDDEN", "No access"), 403
    if asset.source_type == "url" and asset.external_url:
        return redirect(asset.external_url)
    path = asset.file_path
    if not path or not os.path.isfile(path):
        return error_response("NOT_FOUND", "File not found"), 404
    return send_file(
        path,
        as_attachment=True,
        download_name=os.path.basename(path),
        mimetype=asset.mime_type or "application/octet-stream",
    )


@assets_bp.route("/<id>/view", methods=["GET"])
@jwt_required()
def view_asset(id):
    asset = Asset.query.get(id)
    if not asset:
        return error_response("NOT_FOUND", "Asset not found"), 404
    user_id = get_jwt_identity()
    if not can_access_asset(user_id, asset):
        return error_response("FORBIDDEN", "No access"), 403
    if asset.source_type == "url" and asset.external_url:
        return redirect(asset.external_url)
    path = asset.file_path
    if not path or not os.path.isfile(path):
        return error_response("NOT_FOUND", "File not found"), 404
    return send_file(
        path,
        as_attachment=False,
        download_name=os.path.basename(path),
        mimetype=asset.mime_type or "application/octet-stream",
    )
