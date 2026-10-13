export default function VideoPlayer({ url, title }) {
  if (!url) {
    return (
      <div className="bg-dark text-white d-flex align-items-center justify-content-center rounded-3" style={{ minHeight: 320 }}>
        ویدیویی برای این درس ثبت نشده است.
      </div>
    );
  }
  return (
    <div className="ratio ratio-16x9 rounded-3 overflow-hidden shadow-sm">
      <video controls className="w-100" title={title} src={url}>
        مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
      </video>
    </div>
  );
}
