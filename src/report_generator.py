# AegisNet Report Generation Module

import matplotlib.pyplot as plt
from src.config import ACC_PLOT_PATH, LOSS_PLOT_PATH


def generate_plots(history):
    """Generate and save training performance plots.
    
    Args:
        history: Training history object from model.fit()
    """
    print(':: [ReportEngine] - Plotting model performance... ::')
    
    # Plot 1: Model Accuracy
    plt.figure(figsize=(10, 5))
    plt.plot(history.history['accuracy'], label='Training Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.title('AegisNet v1.0 - Model Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend(loc='lower right')
    plt.savefig(ACC_PLOT_PATH)
    plt.close()  # Close the figure to free memory
    
    # Plot 2: Model Loss
    plt.figure(figsize=(10, 5))
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('AegisNet v1.0 - Model Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend(loc='upper right')
    plt.savefig(LOSS_PLOT_PATH)
    plt.close()
    
    print(f'-- Accuracy plot saved to {ACC_PLOT_PATH}')
    print(f'-- Loss plot saved to {LOSS_PLOT_PATH}')
