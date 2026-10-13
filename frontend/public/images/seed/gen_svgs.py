from pathlib import Path

DIR = Path(__file__).parent
colors = ["#2563eb", "#059669", "#dc2626", "#7c3aed", "#d97706", "#0891b2", "#be185d", "#4f46e5", "#65a30d", "#0d9488"]
for i in range(1, 11):
    c = colors[(i - 1) % len(colors)]
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">
  <rect width="600" height="360" fill="{c}"/>
  <text x="300" y="190" font-family="Tahoma,Arial,sans-serif" font-size="24" font-weight="bold" fill="#fff" text-anchor="middle">مقاله {i}</text>
</svg>'''
    (DIR / f"article-{i}.svg").write_text(svg, encoding="utf-8")

avatars = [("#2563eb", "پ"), ("#059669", "م"), ("#7c3aed", "س")]
for i, (c, letter) in enumerate(avatars, 1):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <circle cx="80" cy="80" r="80" fill="{c}"/>
  <text x="80" y="95" font-family="Tahoma,Arial,sans-serif" font-size="48" font-weight="bold" fill="#fff" text-anchor="middle">{letter}</text>
</svg>'''
    (DIR / f"teacher-{i}.svg").write_text(svg, encoding="utf-8")

print("SVG files generated.")
