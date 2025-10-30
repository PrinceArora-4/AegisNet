# AegisNet Feature Selector Module

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from src.config import TARGET_COLUMN


def get_important_features(X, y):
    """Analyze and return the top most important features using RandomForest.
    
    Args:
        X: Feature DataFrame or array
        y: Target labels
        
    Returns:
        List of top 30 most important feature names
    """
    print(':: [FeatureEngine] - Analyzing feature importance... ::')
    
    # We use a RandomForest model because it's fast and good at ranking features.
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X, y)
    
    # Get the importance scores
    importances = model.feature_importances_
    feature_names = X.columns
    
    # Create a DataFrame of features and their scores
    feature_importance_df = pd.DataFrame({'feature': feature_names, 'importance': importances})
    feature_importance_df = feature_importance_df.sort_values(by='importance', ascending=False)
    
    # Select the Top 30 features
    top_features_df = feature_importance_df.head(30)
    top_features_list = top_features_df['feature'].tolist()
    
    print(':: [FeatureEngine] - Top 30 Most Important Features: ::')
    print(top_features_df)
    
    return top_features_list
