# AegisNet FINAL Model Evaluation Module

from sklearn.metrics import classification_report, confusion_matrix
from src.config import CLASSIFICATION_THRESHOLD


def evaluate_model(model, X_test, y_test):
    """Evaluate the trained model using the production threshold.

    Args:
        model: Trained Keras model
        X_test: Test features
        y_test: Test labels
    """
    print(":: [Sentinel_Report] - Generating FINAL performance report... ::")

    # Step 1: Get prediction probabilities
    print("-- Generating raw probabilities on test dataset...")
    y_pred_probs = model.predict(X_test)

    # Step 2: Apply our chosen threshold
    print(
        f":: [AegisNet] - Applying production threshold of: {CLASSIFICATION_THRESHOLD * 100}% ::"
    )
    y_pred = (y_pred_probs > CLASSIFICATION_THRESHOLD).astype(int)

    # Step 3: Generate Final Classification Report
    print(":: FINAL CLASSIFICATION REPORT ::")
    target_names = ["Class 0 (BENIGN)", "Class 1 (ATTACK)"]
    print(classification_report(y_test, y_pred, target_names=target_names))

    # Step 4: Generate Final Confusion Matrix
    print(":: FINAL CONFUSION MATRIX ::")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)
    print("\n-- [Matrix Analysis] --")
    print(f"-- Total ATTACKS MISSED (False Negatives): {cm[1][0]}")
    print(f"-- Total FALSE ALARMS (False Positives): {cm[0][1]}")
    print(f"-- Total ATTACKS DETECTED (True Positives): {cm[1][1]}")
    print(f"-- Total BENIGN CORRECT (True Negatives): {cm[0][0]}")
