import os
import subprocess

def rename_png_in_icons():
    icons_path = os.getcwd()

    for root, dirs, files in os.walk(icons_path):
        for file in files:
            if file.endswith(".PNG"):
                old_path = os.path.join(root, file)
                new_file = file[:-4] + ".png"
                new_path = os.path.join(root, new_file)

                # 用 git mv 改名，保证 Git 识别大小写变化
                subprocess.run(["git", "mv", old_path, new_path])
                print(f"Renamed: {old_path} -> {new_path}")

    # 提交改动
    subprocess.run(["git", "commit", "-m", "Rename .PNG files to .png in icons/"])
    subprocess.run(["git", "push"])

if __name__ == "__main__":
    rename_png_in_icons()
