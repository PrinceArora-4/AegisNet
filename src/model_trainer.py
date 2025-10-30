# AegisNet Model Training Module

import numpy as np
from sklearn.utils import class_weight

MODEL_SAVE_PATH = 'models/aegisnet_v1.keras'


def train_model(model, X_train, y_train, X_test, y_test):
    """Train the neural network model with class weight balancing.
    
    Args:
        model: Compiled Keras model
        X_train: Training features
        y_train: Training labels
        X_test: Test features
        y_test: Test labels
        
    Returns:
        Tuple of (trained_model, training_history)
    """
    print(':: [TrainingSubsystem] - Initiating model training... ::')
    
    # Step 1: Calculate Class Weights
    # This is CRITICAL for our imbalanced dataset. It tells the model to
    # "pay more attention" to the rare 'ATTACK' class.
    print('-- Calculating class weights for imbalanced data...')
    class_weights = class_weight.compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
    class_weights_dict = dict(enumerate(class_weights))
    print(f'-- Class Weights: {class_weights_dict}')
    
    # Step 2: Train the model
    print('-- Starting training... (This will take time) ::')
    # We will train for 10 epochs as a strong baseline.
    # Use a 'batch_size' of 1024 to handle the large dataset.
    # Use 'X_test' and 'y_test' as the 'validation_data'.
    # Pass the 'class_weights_dict' to the 'class_weight' parameter.
    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=10,
        batch_size=1024,
        class_weight=class_weights_dict,
        verbose=1
    )
    
    # Step 3: Save the trained model
    print(':: [TrainingSubsystem] - Training complete. ::')
    print(f'-- Saving model to {MODEL_SAVE_PATH}...')
    model.save(MODEL_SAVE_PATH)
    print('-- Model successfully saved. ::')
    
    # Return the trained model and its history
    return model, history
