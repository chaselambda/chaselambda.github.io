# Given a folder, creates thumbnails of every image

import os
from PIL import Image
import shutil

image_folder = 'assets/colombia'

def resize_image(input_image_path, output_image_path, size):
    original_image = Image.open(input_image_path)
    width, height = original_image.size
    ratio = width/height
    new_height = size
    new_width = int(new_height * ratio)
    resized_image = original_image.resize((new_width, new_height))
    resized_image.save(output_image_path)

images = [img for img in os.listdir(image_folder) if img.endswith(".jpg")]

count = 0
for i, img in enumerate(sorted(images), start=1):
    if '_small' in img:
        continue
    count += 1
    old_image_path = os.path.join(image_folder, img)
    new_image_name = f"p{count}.jpg"
    new_image_path = os.path.join(image_folder, new_image_name)

    os.rename(old_image_path, new_image_path)

    # create a new smaller version
    small_image_name = f"p{count}_small.jpg"
    small_image_path = os.path.join(image_folder, small_image_name)
    resize_image(new_image_path, small_image_path, 1000)
