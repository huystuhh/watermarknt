# Watermarkn't

Python program that (attempts to) removes watermarks from images. 

This is NOT for commercial or financial use, just created as a side project to remove watermarks from images for my own personal use cases.

## Setup

```bash
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

### when finished:
deactivate 
```

## Usage

1. Remove watermark by searching for default "SAMPLE" text:
```bash
python main.py sample no_sample
```

2. Specify watermark text to remove:
```bash
python main.py <input_dir>> <output_dir> --text "WATERMARK"
```

## Notes

Currently, this watermark removal tool is very bad, to be frank. Watermark removal has historically been very difficult to do (unsurprising). You can see the end result images in the [no_sample](./no_sample/) directory (original images in the [sample](./sample/) directory). The watermark is clearly still very visible.

Best-in-class watermark removal tools nowadays leverage AI/ML using inpainting. A couple very powerful watermark tools out there are:
- [WatermarkRemover-AI](https://github.com/D-Ogi/WatermarkRemover-AI)
- [watermark-removal](https://github.com/zuruoke/watermark-removal)

A rudimentary/naive approach to watermark removal without AI/ML seems to be, quite frankly, an exercise in futility. Next steps would be improving this code with that in mind.