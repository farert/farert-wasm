#!/usr/bin/env python3
"""
Script to embed database file into MEMFS for Emscripten build
"""

import sys
import os

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 embed_data.py <input_db_file> <output_dir>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} does not exist")
        sys.exit(1)
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Copy the database file to the output directory
    import shutil
    output_file = os.path.join(output_dir, "jrdbnewest.db")
    shutil.copy2(input_file, output_file)
    
    print(f"Database file copied to {output_file}")
    print("Use --embed-file data/jrdbnewest.db@/data/jrdbnewest.db in emcc command")

if __name__ == "__main__":
    main()