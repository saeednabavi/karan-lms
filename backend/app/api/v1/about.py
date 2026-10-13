from flask import Blueprint
from ...models import AboutInfo
from ...utils.response import success_response

about_bp = Blueprint("about", __name__)


@about_bp.route("", methods=["GET"])
def get_about():
    items = AboutInfo.query.all()
    data = {r.key: r.value for r in items}
    if not data:
        data = {
            "title": "کران بالا",
            "mission": "فراهم‌کردن آموزش باکیفیت، قابل فهم و کاربردی",
            "vision": "تبدیل‌شدن به یکی از معتبرترین پلتفرم‌های آموزش آنلاین فارسی",
        }
    return success_response(data)
