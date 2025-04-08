import sys
import pickle
import json
import numpy as np
import os

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load model and vectorizer using absolute paths
with open(os.path.join(BASE_DIR, "logistic_regression.pkl"), "rb") as f:
    model = pickle.load(f)

with open(os.path.join(BASE_DIR, "tfidf_vectorizer2.pkl"), "rb") as f:
    vectorizer = pickle.load(f)

# Read input from stdin (Node will send JSON here)
data = json.loads(sys.stdin.read())
texts = data.get("texts", [])

vecs = vectorizer.transform(texts)
preds = model.predict(vecs)

# Return predictions
# Replace this line
# print(json.dumps({"predictions": preds.tolist()}))

# With this
labels = ["FAKE" if p == 0 else "REAL" for p in preds]
print(json.dumps({"predictions": labels}))