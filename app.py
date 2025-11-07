"""
AegisNet Flask API
A production-ready REST API for network intrusion detection.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

try:
    from tensorflow.keras.models import load_model
except Exception:
    try:
        from keras.models import load_model
    except Exception:
        raise ImportError(
            "Could not import 'load_model' from 'tensorflow.keras' or 'keras'. Please install 'tensorflow' or 'keras' in your environment."
        )
import numpy as np
import pandas as pd
import joblib
import sys

from src.config import TOP_FEATURES, SCALER_SAVE_PATH, CLASSIFICATION_THRESHOLD

# ============================================================================
# Flask App Initialization
# ============================================================================
app = Flask(__name__)

# Initialize CORS with explicit settings for better cross-origin support
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# ============================================================================
# Global Variables for Model Artifacts
# ============================================================================
model = None
scaler = None

# ============================================================================
# Load Model and Scaler on Startup
# ============================================================================
print("=" * 60)
print("🛡️  AegisNet API - Initializing...")
print("=" * 60)

# ----------------------------------------------------------------------------
# Configure logging
# ----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("aegisnet")

try:
    # Load the trained Keras model
    model_path = "models/aegisnet_v1.keras"
    # Use placeholder formatting (avoid mixing f-string with %s)
    logger.info("Loading model from: %s", model_path)
    model = load_model(model_path)
    logger.info("Model loaded successfully")

    # Load the saved scaler
    logger.info("Loading scaler from: %s", SCALER_SAVE_PATH)
    scaler = joblib.load(SCALER_SAVE_PATH)
    logger.info("Scaler loaded successfully")

    print("=" * 60)
    print("🚀 AegisNet API is ready to accept requests!")
    print("=" * 60)

except Exception as e:
    print(f"❌ Error loading artifacts: {e}")
    logger.exception("Initialization failure")
    sys.exit(1)

# ============================================================================
# Helper Functions
# ============================================================================


def clean_column_names(df):
    """
    Clean DataFrame column names by stripping whitespace.

    Args:
        df (pd.DataFrame): Input DataFrame

    Returns:
        pd.DataFrame: DataFrame with cleaned column names
    """
    df.columns = df.columns.str.strip()
    return df


def preprocess_data(df):
    """
    Preprocess raw DataFrame for prediction.
    Performs the exact same steps as the predictor script.

    Args:
        df (pd.DataFrame): Raw input DataFrame

    Returns:
        np.ndarray: Scaled and preprocessed data ready for prediction
    """
    # Drop the Label column if it exists
    if "Label" in df.columns:
        df = df.drop(columns=["Label"])

    # Filter to include only TOP_FEATURES in the correct order
    df_filtered = df[TOP_FEATURES].copy()

    # Clean the data: replace infinities with NaN, then fill with 0
    df_filtered.replace([np.inf, -np.inf], np.nan, inplace=True)
    df_filtered.fillna(0, inplace=True)

    # Apply the scaler transformation
    X_scaled = scaler.transform(df_filtered)

    return X_scaled


def try_get_feature_importances(top_k=5):
    """
    Attempt to compute a proxy for feature importance from the Keras model.
    Uses absolute weights of the first Dense layer as a heuristic.

    Returns:
        dict[str, float] | None: Mapping of feature name -> importance (normalized), or None if unavailable
    """
    try:
        # Find first Dense-like layer with weights
        first_layer = None
        for layer in getattr(model, "layers", []):
            weights = layer.get_weights()
            if weights and len(weights) >= 1:
                first_layer = layer
                break
        if first_layer is None:
            return None

        W = first_layer.get_weights()[0]  # shape: (n_features, units)
        if W is None or W.size == 0:
            return None

        importances = np.sum(np.abs(W), axis=1)  # aggregate over units
        # Normalize
        total = float(np.sum(importances))
        if total <= 0:
            return None
        normalized = importances / total

        # Map to TOP_FEATURES by original order
        feature_importances = {
            feat: float(normalized[i])
            for i, feat in enumerate(TOP_FEATURES)
            if i < len(normalized)
        }
        # Pick top_k
        top_items = sorted(
            feature_importances.items(), key=lambda x: x[1], reverse=True
        )[:top_k]
        return dict(top_items)
    except Exception:
        logger.exception("Failed to extract feature importances")
        return None


# ============================================================================
# API Endpoints
# ============================================================================


@app.route("/", methods=["GET"])
def root():
    """
    Root endpoint - Health check.

    Returns:
        JSON response indicating API status
    """
    return jsonify({"status": "AegisNet API is online"})


@app.route("/predict", methods=["POST"])
def predict():
    """
    Main prediction endpoint.
    Accepts a CSV file and returns attack/benign classification counts.

    Returns:
        JSON response with prediction results or error message
    """
    try:
        logger.info("/predict called - file upload received")
        # Check if file is present in request
        if "file" not in request.files:
            logger.warning("No file part in request")
            return jsonify({"status": "error", "error": "No file part"}), 400

        file = request.files["file"]

        # Read the CSV file into a DataFrame
        df = pd.read_csv(file)
        logger.info("CSV loaded with shape %s", df.shape)

        # Clean column names
        df = clean_column_names(df)

        # Preprocess the data
        X_scaled = preprocess_data(df)
        logger.info("Data preprocessed: shape after scaling %s", X_scaled.shape)

        # Make predictions
        probabilities = model.predict(X_scaled)

        # Apply classification threshold
        predictions = (probabilities >= CLASSIFICATION_THRESHOLD).astype(int).flatten()

        # Calculate statistics
        total_flows = len(predictions)
        attack_count = np.sum(predictions == 1)
        benign_count = np.sum(predictions == 0)

        # Get threat indices (1-based row numbers for user-friendly display)
        threat_indices = [int(i + 1) for i, pred in enumerate(predictions) if pred == 1]

        # Build threat details including confidence scores
        probs_flat = probabilities.flatten().tolist()
        threat_details = [
            {
                "row_number": int(i + 1),
                "predicted_label": "ATTACK",
                "confidence_score": float(probs_flat[i]),
            }
            for i, pred in enumerate(predictions)
            if pred == 1
        ]

        # Try to compute feature importances (optional)
        feature_importances = try_get_feature_importances(top_k=5)
        if feature_importances is not None:
            logger.info("Feature importances computed: %s", feature_importances)

        # Return success response
        payload = {
            "status": "success",
            "total_flows": int(total_flows),
            "attack_count": int(attack_count),
            "benign_count": int(benign_count),
            "threat_indices": threat_indices,
            "threat_details": threat_details,
        }
        if feature_importances:
            payload["feature_importances"] = feature_importances

        logger.info(
            "Predictions generated | total=%d benign=%d attack=%d",
            total_flows,
            benign_count,
            attack_count,
        )
        return jsonify(payload), 200

    except Exception as e:
        logger.exception("Error in /predict endpoint")
        return jsonify({"status": "error", "error": str(e)}), 500


@app.route("/predict_single", methods=["POST"])
def predict_single():
    """
    Single record prediction endpoint.
    Accepts a JSON payload representing a single network flow record.

    Returns:
        JSON response with prediction and confidence score
    """
    try:
        logger.info("/predict_single called")
        # Get JSON data from request
        json_data = request.get_json()

        if not json_data:
            logger.warning("No JSON data provided")
            return jsonify({"status": "error", "error": "No JSON data provided"}), 400

        # Convert the single JSON record into a one-row pandas DataFrame
        # The columns must match TOP_FEATURES
        df_single = pd.DataFrame([json_data])

        # Preprocess the single-row DataFrame
        X_scaled = preprocess_data(df_single)

        # Make prediction
        y_pred_probs = model.predict(X_scaled, verbose=0)

        # Extract the single probability score
        confidence_score = float(y_pred_probs[0][0])

        # Apply classification threshold
        prediction_binary = 1 if confidence_score >= CLASSIFICATION_THRESHOLD else 0

        # Create human-readable result
        prediction_label = "ATTACK" if prediction_binary == 1 else "BENIGN"

        # Return success response
        logger.info("Single prediction: %s (%.4f)", prediction_label, confidence_score)
        return jsonify(
            {
                "status": "success",
                "prediction": prediction_label,
                "confidence_score": confidence_score,
            }
        ), 200

    except Exception as e:
        logger.exception("Error in /predict_single endpoint")
        return jsonify({"status": "error", "error": str(e)}), 500


# ============================================================================
# Run the Application
# ============================================================================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
