import fitz  # PyMuPDF
import os

PDF_PATH = r"C:\Users\Jonne\Downloads\paris-nice.pdf"
OUTPUT_FOLDER = r"C:\Users\Jonne\Documents\cycling_fantasy_images"

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

doc = fitz.open(PDF_PATH)
img_count = 0

for page_number in range(len(doc)):
    page = doc[page_number]
    for img_index, img in enumerate(page.get_images(full=True)):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        ext = base_image["ext"]
        img_filename = f"jersey_{page_number+1}_{img_index+1}.{ext}"
        img_path = os.path.join(OUTPUT_FOLDER, img_filename)
        with open(img_path, "wb") as f:
            f.write(image_bytes)
        img_count += 1

print(f"Extracted {img_count} images to {OUTPUT_FOLDER}")
