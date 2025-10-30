# AegisNet Data Loading Module

import os
import pandas as pd

from src.config import DATA_DIR, DATA_FILES


def clean_column_names(df):
    """Strip leading/trailing whitespace from all column names.
    
    Args:
        df: pandas DataFrame
        
    Returns:
        DataFrame with cleaned column names
    """
    columns = list(df.columns)
    df.columns = [col.strip() for col in columns]
    return df


def load_and_combine_data():
    """Load all CIC-IDS-2017 dataset files and combine them into a single DataFrame.
    
    Returns:
        Combined pandas DataFrame with all data
    """
    print(':: [Ingestion_Engine] - Initiating data stream... ::')
    dataframes_list = []
    
    for filename in DATA_FILES:
        file_path = os.path.join(DATA_DIR, filename)
        print(f'-- Loading file: {filename}')
        df = pd.read_csv(file_path)
        clean_column_names(df)
        dataframes_list.append(df)
    
    print(':: [Ingestion_Engine] - All files loaded. Merging data streams... ::')
    combined_df = pd.concat(dataframes_list, ignore_index=True)
    print(':: [Ingestion_Engine] - Data Matrix successfully combined. ::')
    return combined_df
