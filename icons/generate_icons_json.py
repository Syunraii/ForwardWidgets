'''
FilePath: /ForwardWidgets/icons/generate_icons_json.py
Description: 
LastEditors: syunraii
Date: 2026-01-08 03:11:11
LastEditTime: 2026-01-08 03:19:08
'''
import os
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))  # 脚本所在目录
ICON_ROOT = SCRIPT_DIR   # 直接就是 icons/ 目录
GITHUB_BASE_URL = "https://raw.githubusercontent.com/Syunraii/ForwardWidgets/refs/heads/master/icons"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg"}

PREFIXES_TO_LAST = ["Other", "Temp"]

def is_image_file(filename):
    return os.path.splitext(filename)[1].lower() in IMAGE_EXTENSIONS

def update_icons_json():
    for folder_name in sorted(os.listdir(ICON_ROOT)):
        folder_path = os.path.join(ICON_ROOT, folder_name)
        json_path = os.path.join(ICON_ROOT, f"{folder_name}.json")

        if not os.path.isdir(folder_path) or not os.path.isfile(json_path):
            continue

        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        files = [fn for fn in os.listdir(folder_path) if is_image_file(fn)]

        def sort_key(name: str):
            return (any(name.startswith(prefix) for prefix in PREFIXES_TO_LAST), name)

        files.sort(key=sort_key)

        icons = [{
            "name": os.path.splitext(file_name)[0],
            "url": f"{GITHUB_BASE_URL}/{folder_name}/{file_name}"
        } for file_name in files]

        data["icons"] = icons

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    update_icons_json()


