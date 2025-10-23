#extract_text.py
import os
import pdfplumber
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import pandas as pd
from docx import Document


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text, tables, and OCR text from a PDF file.
    Works for scanned PDFs, image-based PDFs, and normal text PDFs.
    """
    text_chunks = []

    # --- 1️⃣ Extract selectable text and tables using pdfplumber ---
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            # Extract normal text
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_chunks.append(page_text)

            # Extract tables as CSV-like text
            tables = page.extract_tables()
            for table in tables:
                if table:
                    table_text = "\n".join(
                        [", ".join(cell if cell else "" for cell in row) for row in table]
                    )
                    text_chunks.append(table_text)

    # --- 2️⃣ OCR for image-based or scanned PDFs ---
    try:
        images = convert_from_path(file_path, dpi=400)
        for img in images:
            # Convert to grayscale and enhance contrast for better OCR accuracy
            gray = img.convert("L")
            enhanced = gray.point(lambda x: 0 if x < 150 else 255, "1")

            ocr_text = pytesseract.image_to_string(enhanced, lang="eng")
            if ocr_text.strip():
                text_chunks.append(ocr_text)
    except Exception as e:
        print(f"[WARN] OCR failed for {file_path}: {e}")

    # --- 3️⃣ Combine and deduplicate ---
    unique_text = list(dict.fromkeys([t.strip() for t in text_chunks if t.strip()]))
    combined_text = "\n".join(unique_text)

    return combined_text.strip()


def extract_text_from_image(file_path: str) -> str:
    """Extract text from an image using OCR."""
    image = Image.open(file_path)
    gray = image.convert("L")
    enhanced = gray.point(lambda x: 0 if x < 150 else 255, "1")
    text = pytesseract.image_to_string(enhanced, lang="eng")
    return text.strip()


def extract_text_from_csv(file_path: str) -> str:
    """Extract text content from a CSV by reading all cells."""
    try:
        df = pd.read_csv(file_path)
    except Exception:
        # For malformed CSVs
        df = pd.read_csv(file_path, engine="python", error_bad_lines=False)

    text = "\n".join(df.astype(str).apply(lambda x: ", ".join(x), axis=1))
    return text.strip()


def extract_text_from_txt(file_path: str) -> str:
    """Extract text from a plain text file."""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read().strip()


def extract_text_from_docx(file_path: str) -> str:
    """Extract text from a DOCX file."""
    doc = Document(file_path)
    text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    return text.strip()


def extract_text(file_path: str) -> str:
    """Auto-detect file type and extract text accordingly."""
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".png", ".jpg", ".jpeg"]:
        return extract_text_from_image(file_path)
    elif ext == ".csv":
        return extract_text_from_csv(file_path)
    elif ext == ".txt":
        return extract_text_from_txt(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
