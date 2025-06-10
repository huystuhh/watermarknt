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
python main.py sample output
```

2. Specify watermark text to remove along with directories:
```bash
python main.py <input_dir>> <output_dir> --text "WATERMARK"
```

## Notes

Currently, this watermark removal tool is, to be frank, very bad. Watermark removal has historically been very difficult to do (unsurprisingly, by design). You can see the end result images in the [output](./output/) directory and original images in the [sample](./sample/) directory. The watermark is clearly still visible.

Original | Result
:-------------------------:|:-------------------------:
![SAMPLE](./sample/OP01-003_p1.png) | ![OUTPUT](./output/OP01-003_p1.png)

Best-in-class watermark removal tools nowadays leverage AI/ML using inpainting. A couple powerful watermark tools out there are:
- [WatermarkRemover-AI](https://github.com/D-Ogi/WatermarkRemover-AI){:target="_blank" rel="noopener noreferrer"}
- [watermark-removal](https://github.com/zuruoke/watermark-removal){:target="_blank" rel="noopener noreferrer"}

A rudimentary/naive approach to watermark removal without AI/ML such as this one ultimately seems to be an exercise in futility. Next steps would be improving this code with that in mind.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

The GPL-3.0 license ensures that:
- This software is free and open source
- Any modifications must also be open source
- Commercial use is not permitted without explicit permission
- The author is protected from liability