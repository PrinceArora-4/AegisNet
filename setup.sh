#!/bin/bash
#
# AegisNet - Setup Script
#

# --- Define Colors ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}:: [AegisNet] - DATASET SETUP SCRIPT ::${NC}"

# --- Step 1: Check for Kaggle API credentials ---
echo -e ":: [1/5] Checking for Kaggle API credentials... ::"
KAGGLE_KEY=~/.kaggle/kaggle.json

if [ ! -f "$KAGGLE_KEY" ]; then
    echo -e "${RED}ERROR: Kaggle API key not found.${NC}"
    echo -e "${YELLOW}Please set up your API key first (see documentation) and re-run.${NC}"
    exit 1
fi
echo ":: Kaggle credentials found. ::"

# --- Step 2: Install Dependencies ---
echo -e ":: [2/5] Installing dependencies (kaggle, unzip)... ::"
# Check for python3
if ! command -v python3 &> /dev/null
then
    echo -e "${RED}Error: 'python3' is not found. Please ensure Python is installed and in your PATH.${NC}"
    exit 1
fi

# Use python3 -m pip to ensure we use the venv's pip
python3 -m pip install kaggle

# Check for unzip
if ! command -v unzip &> /dev/null
then
    echo -e "${RED}Error: 'unzip' is required. Please install it (e.g., 'brew install unzip')${NC}"
    exit 1
fi

# --- Step 3: Create Data Directory ---
echo -e ":: [3/5] Creating data directory... ::"
mkdir -p data

# --- Step 4: Download Dataset ---
echo -e "${YELLOW}:: [4/5] Downloading dataset: 'chethuhn/network-intrusion-dataset'... ::${NC}"
kaggle datasets download -d chethuhn/network-intrusion-dataset -p data/ --unzip

# --- Step 5: Clean Up ---
echo -e ":: [5/5] Cleaning up... ::"
# The --unzip flag already unzipped, so we just remove the zip file.
echo ":: Cleanup complete. ::"

echo -e "\n=========================================="
echo -e ":: ${GREEN}[AegisNet] - SETUP SCRIPT FINISHED.${NC} ::"
echo "=========================================="
