# AegisNet v1.2 - Main Execution Pipeline

import tensorflow as tf
import keras_tuner as kt
from src.data_loader import load_and_combine_data
from src.data_preprocessor import preprocess_data
from src.model_builder import build_hypermodel
from src.model_trainer import MODEL_SAVE_PATH
from src.model_evaluator import evaluate_model
from src.report_generator import generate_plots


def run_pipeline():
    """Execute the AegisNet v1.2 anomaly detection pipeline with hyperparameter tuning."""
    print(":: [AegisNet v1.2] - INITIATING ANOMALY DETECTION PIPELINE... ::")
    print(":: [Phase 1/4] - LOADING DATA ::")

    df = load_and_combine_data()

    print(":: [Phase 1/4] - DATA LOADED. ::")
    print(df.shape)
    print(":: [Ingestion_Engine] - Verifying data types... ::")
    print(df.info())

    print(":: [Phase 2/4] - PREPROCESSING DATA ::")
    X_train, X_test, y_train, y_test, X_unscaled, y_unscaled = preprocess_data(df)
    print(":: [Phase 2/4] - PREPROCESSING COMPLETE. ::")

    print(f"X_train shape: {X_train.shape}")
    print(f"y_train shape: {y_train.shape}")
    print(f"X_test shape: {X_test.shape}")
    print(f"y_test shape: {y_test.shape}")

    # # Phase 2.5: Feature Selection (COMMENT OUT AFTER FIRST RUN)
    # print(":: [Phase 2.5] - RUNNING FEATURE SELECTION ::")
    # top_features_list = get_important_features(X_unscaled, y_unscaled)
    # print("\n !! ACTION REQUIRED !!")
    # print(
    #     "Copy the list of features above into 'src/config.py' in the 'TOP_FEATURES' variable."
    # )
    # print("Then, comment out this 'Phase 2.5' block and re-run main.py to use them.")
    # return  # Stop the pipeline here for the user to update the config

    print(":: [Phase 3/4] - BUILDING & TRAINING MODEL ::")

    # HyperTuner: Search for optimal architecture
    tuner = kt.Hyperband(
        hypermodel=lambda hp: build_hypermodel(hp, input_shape=X_train.shape[1]),
        objective="val_accuracy",
        max_epochs=10,
        factor=3,
        directory="models",
        project_name="aegisnet_hyperband",
    )

    # Create a callback to stop training early if it stops improving
    stop_early = tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=3)

    print(":: [HyperTuner] - Searching for optimal model architecture... ::")
    # We use a smaller subset of data for the search to make it faster.
    X_train_sample = X_train[:500000]
    y_train_sample = y_train[:500000]
    X_test_sample = X_test[:100000]
    y_test_sample = y_test[:100000]

    tuner.search(
        X_train_sample,
        y_train_sample,
        epochs=10,
        validation_data=(X_test_sample, y_test_sample),
        callbacks=[stop_early],
    )

    # Get the optimal hyperparameters
    best_hps = tuner.get_best_hyperparameters(num_trials=1)[0]
    print(f":: [HyperTuner] - BEST HPs FOUND: {best_hps.values} ::")

    # Build the 'champion' model with the best HPs and train it on ALL data
    print(":: [TrainingSubsystem] - Training 'Champion' model on full dataset... ::")
    champion_model = tuner.hypermodel.build(best_hps)
    history = champion_model.fit(
        X_train,
        y_train,
        validation_data=(X_test, y_test),
        epochs=15,  # Train the final model for a bit longer
        batch_size=1024,
        callbacks=[stop_early],
    )

    # Save the champion model
    champion_model.save(MODEL_SAVE_PATH)
    print(f"-- Champion model saved to {MODEL_SAVE_PATH} --")
    print(":: [Phase 3/4] - MODEL TRAINING COMPLETE. ::")

    print(":: [Phase 4/5] - GENERATING PERFORMANCE PLOTS ::")
    generate_plots(history)
    print(":: [Phase 4/5] - PLOTS SAVED to 04_reports folder. ::")

    print(":: [Phase 5/5] - EVALUATING MODEL PERFORMANCE ::")

    # Call the evaluation function with the champion model
    evaluate_model(champion_model, X_test, y_test)

    print(":: [Phase 5/5] - EVALUATION COMPLETE. ::")
    print()
    print(":: [AegisNet v1.2] - PIPELINE FINISHED. SYSTEM NOMINAL. ::")


if __name__ == "__main__":
    run_pipeline()
