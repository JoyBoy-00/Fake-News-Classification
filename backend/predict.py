import sys
import pickle
import json
import numpy as np
import os
import re
import string
from collections import Counter

# ------------------ Clean Text Function ------------------
def clean_text(text):
    text = text.lower()
    text = re.sub(r'http\S+|www\S+|https\S+', ' ', text, flags=re.MULTILINE)
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    text = re.sub(r"won't", "would not", text)
    text = re.sub(r"im", "i am", text)
    text = re.sub(r"dont", "do not", text)
    text = re.sub(r"can't", "can not", text)
    text = re.sub(r"don't", "do not", text)
    text = re.sub(r"shouldn't", "should not", text)
    text = re.sub(r"needn't", "need not", text)
    text = re.sub(r"hasn't", "has not", text)
    text = re.sub(r"haven't", "have not", text)
    text = re.sub(r"weren't", "were not", text)
    text = re.sub(r"mightn't", "might not", text)
    text = re.sub(r"didn't", "did not", text)
    text = re.sub(r"n't", " not", text)
    text = re.sub(r"'re", " are", text)
    text = re.sub(r"'s", " is", text)
    text = re.sub(r"'d", " would", text)
    text = re.sub(r"'ll", " will", text)
    text = re.sub(r"'t", " not", text)
    text = re.sub(r"'ve", " have", text)
    text = re.sub(r"'m", " am", text)

    # Clean symbols and whitespace
    text = re.sub(r'\[.*?\]', '', text)
    text = re.sub(r'\W', ' ', text)
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'<.*?>+', '', text)
    text = re.sub(r'[%s]' % re.escape(string.punctuation), '', text)
    text = re.sub(r'\w*\d\w*', '', text)
    text = re.sub(r'\s+', ' ', text).strip()

    return text

# ------------------ Load Vectorizer ------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE_DIR, "tfidf_vectorizer2.pkl"), "rb") as f:
    vectorizer = pickle.load(f)

# ------------------ Load Models ------------------
models_dir = os.path.join(BASE_DIR, "models")
model_files = [f for f in os.listdir(models_dir) if f.endswith(".pkl")]
models = {}

for model_file in model_files:
    model_name = os.path.splitext(model_file)[0]
    with open(os.path.join(models_dir, model_file), "rb") as f:
        models[model_name] = pickle.load(f)

# ------------------ Read Input from stdin ------------------
data = json.loads(sys.stdin.read())
texts = data.get("texts", [])

# Clean and vectorize input
cleaned_texts = [clean_text(t) for t in texts]
vecs = vectorizer.transform(cleaned_texts)

# ------------------ Predict ------------------
all_preds = []
model_outputs = {}

for name, model in models.items():
    preds = model.predict(vecs)

    # Flip preds for logistic regression before appending to all_preds
    if "logistic" in name.lower():
        flipped_preds = np.array([1 if p == 0 else 0 for p in preds])
        all_preds.append(flipped_preds)
        model_outputs[name] = ["Not A Fake News" if p == 0 else "Fake News" for p in preds]
    else:
        all_preds.append(preds)
        model_outputs[name] = ["Fake News" if p == 0 else "Not A Fake News" for p in preds]

        
    print(f"{name} Predictions: {model_outputs[name]}", file=sys.stderr)
    
# Convert to numpy array: shape = (n_models, n_texts)
all_preds = np.array(all_preds)

# Majority vote for each input
final_preds = []
for i in range(all_preds.shape[1]):
    votes = all_preds[:, i]
    vote_count = Counter(votes)
    majority_vote = vote_count.most_common(1)[0][0]
    final_preds.append(int(majority_vote))

labels = ["FAKE" if p == 0 else "REAL" for p in final_preds]

print(f"{name} label: {labels}", file=sys.stderr)

# ------------------ Output ------------------
print(json.dumps({
    "predictions": labels,
    "raw_predictions": final_preds,  # Already converted to int
    "individual_model_outputs": model_outputs
}))