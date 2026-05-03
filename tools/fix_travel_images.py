from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(r"C:\Users\온유\Workspace\New project 2\frontend\public\travel")
IMAGE_1 = ROOT / "goseong-trip-1.png"
IMAGE_2 = ROOT / "goseong-trip-2.png"
OUT_1 = ROOT / "goseong-trip-1-corrected.png"
OUT_2 = ROOT / "goseong-trip-2-corrected.png"

FONT_REGULAR = ImageFont.truetype(r"C:\Windows\Fonts\malgun.ttf", 18)
FONT_MEDIUM = ImageFont.truetype(r"C:\Windows\Fonts\malgun.ttf", 26)
FONT_BOLD_18 = ImageFont.truetype(r"C:\Windows\Fonts\malgunbd.ttf", 18)
FONT_BOLD_22 = ImageFont.truetype(r"C:\Windows\Fonts\malgunbd.ttf", 22)
FONT_BOLD_30 = ImageFont.truetype(r"C:\Windows\Fonts\malgunbd.ttf", 30)


def fix_image_1():
    image = Image.open(IMAGE_1).convert("RGBA")
    draw = ImageDraw.Draw(image)

    pale_blue = (241, 248, 255, 255)
    deep_text = (38, 48, 74, 255)
    accent_blue = (60, 114, 193, 255)

    # Correct departure weekday.
    draw.rounded_rectangle((84, 268, 368, 386), radius=18, fill=pale_blue)
    draw.text((96, 284), "5/1(금) 05:30 추천", font=FONT_BOLD_18, fill=deep_text)
    draw.text((96, 310), "(전날 밤 이동도 Good!)", font=FONT_REGULAR, fill=deep_text)

    # Correct return weekday while keeping the second warning line.
    draw.text((96, 340), "5/3(일) 09:00 이전 출발 추천", font=FONT_BOLD_18, fill=deep_text)
    draw.text((96, 366), "(오후 출발 시 정체 심해요!)", font=FONT_REGULAR, fill=deep_text)

    # Add a compact date badge near the title for clarity.
    draw.rounded_rectangle((350, 144, 746, 190), radius=24, fill=(255, 250, 239, 245), outline=accent_blue, width=2)
    draw.text((382, 154), "26년 5/1(금) ~ 5/3(일) · 아야진 스테이", font=FONT_BOLD_22, fill=accent_blue)

    image.save(OUT_1)


def fix_image_2():
    image = Image.open(IMAGE_2).convert("RGBA")
    draw = ImageDraw.Draw(image)

    dark_text = (81, 33, 29, 255)
    badge_fill = (255, 246, 251, 248)
    badge_outline = (197, 132, 150, 255)
    soft_bg = (255, 249, 250, 255)

    # Add a date/place badge below the main title.
    draw.rounded_rectangle((462, 282, 1065, 342), radius=30, fill=badge_fill, outline=badge_outline, width=3)
    draw.text((538, 296), "26년 5/1(금) ~ 5/3(일) · 아야진 스테이", font=FONT_BOLD_30, fill=dark_text)

    # Fix a visible typo around the Day 1 meal label.
    draw.rounded_rectangle((632, 636, 930, 708), radius=18, fill=soft_bg)
    draw.text((676, 653), "장미경양식 돈까스", font=FONT_BOLD_30, fill=dark_text)

    image.save(OUT_2)


if __name__ == "__main__":
    ROOT.mkdir(parents=True, exist_ok=True)
    fix_image_1()
    fix_image_2()
    print(OUT_1)
    print(OUT_2)
