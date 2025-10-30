# AegisNet v1.3.1 - Standalone Prediction Script (Warning-Free)

import pandas as pd
import numpy as np
import joblib
import sys
from tensorflow.keras.models import load_model
from src.config import SCALER_SAVE_PATH, TOP_FEATURES, CLASSIFICATION_THRESHOLD

MODEL_SAVE_PATH = "models/aegisnet_v1.keras"


def clean_column_names(df):
    """Strip leading/trailing whitespace from all column names.

    Args:
        df: pandas DataFrame

    Returns:
        DataFrame with cleaned column names
    """
    df.columns = [col.strip() if isinstance(col, str) else col for col in df.columns]
    return df


def run_predictor(input_csv_path):
    """Run the AegisNet predictor on new data.

    Args:
        input_csv_path: Path to the CSV file containing new data
    """
    print(":: [AegisNet v1.3.1 PREDICTOR] - Initiating... ::")

    # Step 1: Load Data
    print(f"-- Loading new data from {input_csv_path}...")
    new_data_df = pd.read_csv(input_csv_path)
    new_data_df = clean_column_names(new_data_df)
    original_df = new_data_df.copy()  # Keep a copy for the final report

    # Step 2: Load Model and Scaler
    print(f"-- Loading Champion model from {MODEL_SAVE_PATH}...")
    model = load_model(MODEL_SAVE_PATH)
    print(f"-- Loading data scaler from {SCALER_SAVE_PATH}...")
    scaler = joblib.load(SCALER_SAVE_PATH)

    # Step 3: Preprocess New Data
    print(f"-- Preprocessing data... (Filtering for Top {len(TOP_FEATURES)} features)")
    if "Label" in new_data_df.columns:
        new_data_df = new_data_df.drop("Label", axis=1)

    # Filter for the Top 30 features in the correct order
    new_data_X = new_data_df[TOP_FEATURES].copy()  # Use .copy() to prevent warnings

    # Clean 'inf' and 'nan' values using .loc to modify the DataFrame directly
    new_data_X.loc[:, :] = new_data_X.replace([np.inf, -np.inf], np.nan)
    new_data_X.loc[:, :] = new_data_X.fillna(0)

    # Scale the data
    X_scaled = scaler.transform(new_data_X)

    # Step 4: Make Predictions
    print(f"-- Running predictions... (Threshold: {CLASSIFICATION_THRESHOLD * 100}%)")
    y_pred_probs = model.predict(X_scaled)
    y_pred = (y_pred_probs > CLASSIFICATION_THRESHOLD).astype(int)

    # Step 5: Generate Report
    print("-- Generating prediction report... ::")
    original_df["prediction_probability"] = y_pred_probs
    original_df["prediction"] = np.where(y_pred == 1, "ATTACK", "BENIGN")

    # Save the report
    output_filename = "prediction_report.csv"
    original_df.to_csv(output_filename, index=False)
    print("\n:: [AegisNet PREDICTOR] - COMPLETE ::")
    print(f"-- Final report saved to: {output_filename}")
    print(original_df["prediction"].value_counts())


if __name__ == "__main__":
    # Check if the user provided a file path
    if len(sys.argv) != 2:
        print("ERROR: You must provide a path to a CSV file.")
        print("Usage: python predictor.py <path_to_your_file.csv>")
        sys.exit(1)
    input_file = sys.argv[1]
    run_predictor(input_file)
