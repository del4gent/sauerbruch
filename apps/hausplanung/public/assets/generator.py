#!/usr/bin/env python3
"""
Sauerbruch 3 - PDF Generator
Entry point for building the architectural documentation.
"""
import sys
import os

# Add current directory to path so pdf_builder can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from pdf_builder.main import build_pdf
except ImportError as e:
    print(f"Error: Could not import pdf_builder. Ensure the directory structure is correct. Details: {e}")
    sys.exit(1)

if __name__ == "__main__":
    try:
        build_pdf()
    except Exception as e:
        print(f"An error occurred during PDF generation: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
