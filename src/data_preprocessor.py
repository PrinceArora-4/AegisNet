# AegisNet Data Preprocessing Module

import numpy as np
import joblib

from src.config import TARGET_COLUMN, TOP_FEATURES, SCALER_SAVE_PATH
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


def preprocess_data(df):
    """Preprocess the combined dataset for model training.

    Args:
        df: Combined pandas DataFrame with all data

    Returns:
        Tuple of (X_train_scaled, X_test_scaled, y_train, y_test, X, y)
    """
    print(":: [DataSanitizer] - Initiating data sanitization... ::")

    # Step 1: Handle infinite values
    print("-- Step 1/5: Neutralizing infinite values...")
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.dropna(inplace=True)

    # Step 2: Separate features (X) and target (y)
    print("-- Step 2/5: Isolating target variable...")
    y = np.where(df[TARGET_COLUMN] == "BENIGN", 0, 1)
    X = df.drop(TARGET_COLUMN, axis=1)

    # Step 2b: Filter for Top Features
    if TOP_FEATURES:  # Check if the list is not empty
        print(f"-- Step 2b/5: Filtering for Top {len(TOP_FEATURES)} features...")
        X = X[TOP_FEATURES]
    else:
        print(
            f"-- Step 2b/5: No top features defined. Using all {X.shape[1]} features."
        )

    # Step 3: Print target distribution
    print("-- Step 3/5: Analyzing target distribution (0=BENIGN, 1=ATTACK)...")
    unique, counts = np.unique(y, return_counts=True)
    print(dict(zip(unique, counts)))

    # Step 4: Split data into training and test sets
    print("-- Step 4/5: Splitting data matrix (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Step 5: Scale numerical features
    print("-- Step 5/5: Standardizing feature scales...")
    scaler = StandardScaler()
    scaler.fit(X_train)
    print(f"-- Saving scaler to {SCALER_SAVE_PATH}...")
    joblib.dump(scaler, SCALER_SAVE_PATH)
    X_train_scaled = scaler.transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print(":: [DataSanitizer] - Sanitization complete. Data is sterile. ::")
    return X_train_scaled, X_test_scaled, y_train, y_test, X, y
