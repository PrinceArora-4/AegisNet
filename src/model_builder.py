# AegisNet v1.2 Hypermodel Architecture Module (Corrected)

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout


def build_hypermodel(hp, input_shape):
    """Build a hyperparameter-tunable model architecture.

    Args:
        hp: HyperParameters object from KerasTuner
        input_shape: Number of input features

    Returns:
        Compiled Keras Sequential model with tunable hyperparameters
    """
    model = Sequential()

    # 1. Tune the number of neurons in the first Dense layer
    hp_units_1 = hp.Int("units_1", min_value=32, max_value=256, step=32)
    # Use the 'input_shape' argument directly
    model.add(Dense(units=hp_units_1, activation="relu", input_shape=(input_shape,)))

    # 2. Tune the Dropout rate
    hp_dropout_1 = hp.Float("dropout_1", min_value=0.1, max_value=0.5, step=0.1)
    model.add(Dropout(rate=hp_dropout_1))

    # 3. Tune the number of hidden layers
    for i in range(hp.Int("num_layers", 1, 3)):
        hp_units = hp.Int(f"units_{i + 2}", min_value=32, max_value=128, step=32)
        model.add(Dense(units=hp_units, activation="relu"))
        hp_dropout = hp.Float(
            f"dropout_{i + 2}", min_value=0.1, max_value=0.5, step=0.1
        )
        model.add(Dropout(rate=hp_dropout))

    # 4. Add the final output layer
    model.add(Dense(1, activation="sigmoid"))

    # 5. Tune the learning rate
    hp_learning_rate = hp.Choice("learning_rate", values=[1e-2, 1e-3, 1e-4])
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=hp_learning_rate),
        loss="binary_crossentropy",
        metrics=["accuracy"],
    )

    return model
