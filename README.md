# 🛡️ AegisNet - Deep Learning Intrusion Detection System

> A high-performance, lightweight Intrusion Detection System (IDS) powered by a custom-tuned Deep Neural Network. `AegisNet` ingests and sanitizes raw network traffic, performs intelligent feature selection, and uses an auto-optimized model to detect cyber threats with 99%+ accuracy.

---

## 🚀 Features

- **Automated Data Pipeline:** Ingests and combines all 8 large CIC-IDS-2017 CSV files (over 2.8 million rows) into a single data matrix.
- **Intelligent Sanitization:** Automatically cleans 1.7GB+ of data, handling `infinity` (`inf`) and `NaN` values to create a sterile, model-ready dataset.
- **Smart Feature Selection:** Uses a RandomForest model to analyze all 78 features and programmatically select the **Top 30 most important ones**, creating a lighter, faster model.
- **AutoML Model Tuning:** Employs **KerasTuner (Hyperband)** to automatically test hundreds of different neural network architectures to find the "Champion" model, removing all guesswork.
- **High-Precision Detection:** Achieves **99%+ accuracy** with a 90% threshold, optimized to minimize "Alert Fatigue" (False Positives).
- **Dual-Pipeline Architecture:**
  1.  **`main.py`:** A complete training pipeline to build and save the champion model.
  2.  **`predictor.py`:** A lightweight, standalone script to load the saved model and run high-speed predictions on new, unseen data.

---

## 🎯 Tech Stack

| Layer             | Technologies Used                    |
| :---------------- | :----------------------------------- |
| **Core**          | Python 3.10+                         |
| **Data Science**  | Pandas, Numpy, Scikit-learn (joblib) |
| **Deep Learning** | TensorFlow, Keras                    |
| **AutoML**        | KerasTuner (Hyperband)               |
| **Data Source**   | Kaggle API (CIC-IDS-2017 Dataset)    |
| **Tools**         | Git, GitHub, VS Code, venv           |

---

## 📁 Folder Structure

```bash
AegisNet/
├── 📁 data/
│   ├── 📄 Monday-WorkingHours.pcap_ISCX.csv
│   └── 📄 (and 7 other .csv files...)
├── 📁 models/
│   ├── 📄 aegisnet_scaler.joblib # Saved Data Scaler
│   └── 📄 aegisnet_v1.keras    # Saved Champion Model
├── 📁 reports/
│   ├── 🖼️ aegisnet_v1_accuracy.png
│   └── 🖼️ aegisnet_v1_loss.png
├── 📁 src/
│   ├── 🐍 __init__.py
│   ├── 🐍 config.py
│   ├── 🐍 data_loader.py
│   ├── 🐍 data_preprocessor.py
│   ├── 🐍 feature_selector.py
│   ├── 🐍 model_builder.py
│   ├── 🐍 model_evaluator.py
│   ├── 🐍 model_trainer.py
│   └── 🐍 report_generator.py
├── ⚙️ .gitignore
├── 🐍 main.py                 # The "Factory" (Trains the model)
├── 🐍 predictor.py            # The "Product" (Runs predictions)
├── 📜 requirements.txt
└── 🚀 setup.sh                # Downloads all data
```

---

## 🔧 Installation & Setup Guide

Follow these steps exactly to set up and run the project from scratch.

### 1. Clone the Repository

```bash
git clone https://github.com/PrinceArora-4/AegisNet.git
cd AegisNet
```

### 2. Set Up Kaggle API Key (One-Time Setup)

This project requires downloading the dataset from Kaggle.

1.  Log in to `kaggle.com` and go to your **Account** page.

2.  Click **"Create New API Token"** to download `kaggle.json`.

3.  Run the following commands in your terminal:

    ```bash
    # Create the .kaggle directory
    mkdir -p ~/.kaggle

    # Move the key to the correct location
    mv ~/Downloads/kaggle.json ~/.kaggle/kaggle.json

    # Set the correct permissions
    chmod 600 ~/.kaggle/kaggle.json
    ```

### 3. Create Virtual Environment

```bash
# Create the environment
python3 -m venv venv

# Activate the environment
source venv/bin/activate
```

### 4. Install Dependencies

Install all required libraries using the `requirements.txt` file.

```bash
pip install -r requirements.txt
```

### 5. Download the Dataset

Run the `setup.sh` script to automatically install the `kaggle` CLI, download, unzip, and clean the 1.8GB dataset.

```bash
# Make the script executable
chmod +x setup.sh

# Run the script
./setup.sh
```

This will populate your `data/` folder with the 8 required CSV files that our pipeline is built for.

---

## ⚙️ How to Run the Project (Workflow)

This project has two main scripts: `main.py` (to train) and `predictor.py` (to predict).

### Run 1: Feature Selection

First, we must run the feature selection module to find our Top 30 features.

1.  Run `main.py`:
    ```bash
    python main.py
    ```
2.  The script will stop at **Phase 2.5** and print a list of the **Top 30 features**.
3.  **Manually copy** that list of 30 feature names.
4.  Open `src/config.py` and **paste** the list into the `TOP_FEATURES = []` variable.

### Run 2: Train the Champion Model

Now, we run the full training pipeline.

1.  In `main.py`, **comment out** the entire "Phase 2.5" block (from `print(":: [Phase 2.5]...` to `return`).
2.  Save the `main.py` file.
3.  Run the script again:
    ```bash
    python main.py
    ```

This will take a long time. It will:

- Filter for your Top 30 features.
- Run the **KerasTuner** to find the best model architecture.
- Train the final "Champion" model.
- Save `aegisnet_v1.keras` and `aegisnet_scaler.joblib` to the `models/` folder.

### Run 3: Make Predictions

You can now use the `predictor.py` script to analyze any new CSV file (that has the same columns). We will use one of our training files as an example.

```bash
python predictor.py data/Monday-WorkingHours.pcap_ISCX.csv
```

This will load your saved model, run predictions, and save a `prediction_report.csv` file in your root directory.

---

## 📜 Requirements (`requirements.txt`)

```
absl-py==2.3.1
astunparse==1.6.3
certifi==2025.10.5
charset-normalizer==3.4.4
contourpy==1.3.3
cycler==0.12.1
flatbuffers==25.9.23
fonttools==4.60.1
gast==0.6.0
google-pasta==0.2.0
grpcio==1.76.0
h5py==3.15.1
idna==3.11
joblib==1.5.2
kaggle
keras==3.12.0
keras-tuner==1.4.7
kiwisolver==1.4.9
kt-legacy==1.0.5
libclang==18.1.1
Markdown==3.9
markdown-it-py==4.0.0
MarkupSafe==3.0.3
matplotlib==3.10.7
mdurl==0.1.2
ml_dtypes==0.5.3
namex==0.1.0
numpy==2.3.4
opt_einsum==3.4.0
optree==0.17.0
packaging==25.0
pandas==2.3.3
pillow==12.0.0
protobuf==6.33.0
Pygments==2.19.2
pyparsing==3.2.5
python-dateutil==2.9.0.post0
pytz==2025.2
requests==2.32.5
rich==14.2.0
scikit-learn==1.7.2
scipy==1.16.3
setuptools==80.9.0
six==1.17.0
tensorboard==2.20.0
tensorboard-data-server==0.7.2
tensorflow==2.20.0
termcolor==3.2.0
threadpoolctl==3.6.0
typing_extensions==4.15.0
tzdata==2025.2
urllib3==2.5.0
Werkzeug==3.1.3
wheel==0.45.1
wrapt==2.0.0
```

---

## 📌 Core Functional Files

| File                   | Description                                                           |
| :--------------------- | :-------------------------------------------------------------------- |
| **`main.py`**          | **The "Factory"**: Main training pipeline that runs all 5 phases.     |
| **`predictor.py`**     | **The "Product"**: Standalone script to run predictions on new data.  |
| `setup.sh`             | Shell script to install `kaggle` and download the correct dataset.    |
| `config.py`            | Central configuration for file paths, features, and model thresholds. |
| `data_loader.py`       | Module to load and combine all 8 CSV files.                           |
| `data_preprocessor.py` | Cleans, scales, and splits the data. Saves the `scaler.joblib`.       |
| `feature_selector.py`  | Runs `RandomForestClassifier` to find and rank the best features.     |
| `model_builder.py`     | Defines the `Hypermodel` architecture for KerasTuner to search.       |
| `model_trainer.py`     | Contains the logic for training the final champion model.             |
| `model_evaluator.py`   | Generates the final Classification Report and Confusion Matrix.       |
| `report_generator.py`  | Saves the `accuracy.png` and `loss.png` plots.                        |

---

## 🚀 Deployment Strategy

- ✅ **Current:** The project is fully functional for local execution. The `main.py` script trains the model, and `predictor.py` consumes it.
- ⚙️ **Future Scope:** The `predictor.py` script can be easily wrapped in a **Flask API**. A new `app.py` could be built to provide a web endpoint that accepts a CSV, runs the prediction, and returns the results as JSON. This API could then be Dockerized and deployed to a cloud service.

---

## 🏆 Highlights

- ✅ **End-to-End:** A complete, group-developed project from raw data ingestion to a tuned, deployable prediction script.
- 🧠 **AutoML:** Demonstrates a modern workflow using KerasTuner to find an optimal model, rather than just guessing.
- 🎯 **High-Performance:** Achieves 99%+ accuracy and 99.6% precision by intelligently balancing metrics and tuning the decision threshold.
- 📦 **Modular Code:** Fully modularized Python scripts in the `src/` folder make the project clean, scalable, and easy to maintain.

---

## 📬 Contact

> **Prince Arora**
> 🌐 [LinkedIn](https://www.linkedin.com/in/princearora4)
> 🔗 [GitHub](https://github.com/princearora-4)
> 📧 [princeharora4@gmail.com](mailto:princeharora4@gmail.com)

---

## 📄 License

This project is licensed under the **MIT License**.
