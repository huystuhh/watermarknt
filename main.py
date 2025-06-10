import sys
from pathlib import Path
import numpy as np
import cv2
import argparse

np.set_printoptions(threshold=sys.maxsize)

def generate_text_mask(image_shape, text="SAMPLE"):
    mask = np.zeros(image_shape[:2], dtype=np.uint8)
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 6.0  # Large text
    thickness = 18    # Bold
    text_size, _ = cv2.getTextSize(text, font, font_scale, thickness)
    text_width, text_height = text_size

    # Text should always be centered on the image
    x = (mask.shape[1] - text_width) // 2
    y = (mask.shape[0] + text_height) // 2

    # Draw mask
    cv2.putText(mask, text, (x, y), font, font_scale, 255, thickness, cv2.LINE_AA)
    return mask

def remove_watermark(image_path, output_path, watermark_text="SAMPLE"):
    image = cv2.imread(str(image_path))
    if image is None:
        print(f"Error: Could not read image at {image_path}")
        return False

    mask = generate_text_mask(image.shape, watermark_text)

    # Use OpenCV inpainting
    result = cv2.inpaint(image, mask, 7, cv2.INPAINT_TELEA)
    cv2.imwrite(str(output_path), result)

    return True

def process_images(input_dir, output_dir, watermark_text="SAMPLE"):
    # Create output directory if it doesn't exist
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Get all image files
    input_dir = Path(input_dir)
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'}
    image_files = [f for f in input_dir.iterdir() if f.suffix.lower() in image_extensions]

    if not image_files:
        print(f"No image files found in {input_dir}")
        return

    print(f"Found {len(image_files)} images to process")

    # Process each image
    processed_count = 0
    for image_path in image_files:
        output_path = output_dir / image_path.name
        if remove_watermark(image_path, output_path, watermark_text):
            processed_count += 1

    print("Processing complete:")
    print(f"- Successful: {processed_count}")
    print(f"- Failed: {len(image_files) - processed_count}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input_dir', help='Input directory containing images to remove watermarks from')
    parser.add_argument('output_dir', help='Output directory to save images')
    parser.add_argument('--text', default="SAMPLE", help='Watermark text to look for (default: "SAMPLE")')

    args = parser.parse_args()

    try:
        process_images(args.input_dir, args.output_dir, args.text)
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
