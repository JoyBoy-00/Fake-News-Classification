# 📰 Fake News Detection App

A full-stack web app that classifies news articles as **REAL** or **FAKE** using multiple ML models, integrated with a modern Next.js frontend and a Python-powered Node.js backend.

## 🔗 Live Demo

-  [fake-news-classification](https://fake-news-classification.vercel.app/)  

---

## 🧠 Features

- Fake news classification using multiple ML models (Logistic Regression, Naive Bayes, SVM, Random Forest, XGBoost)
- Ensemble majority voting
- Input text cleaning and vectorization
- Gemini-based second-opinion API support (optional)
- News API integration (optional)
- Built with Next.js frontend + Express.js backend (Python subprocess for ML)
- ✅ Deployed FREE on **Vercel (frontend)** and **Render (backend)**

---

## 🧠 Machine Learning

- Models trained on a labeled dataset (`FAKE` vs `REAL`)
- Includes:
  - Logistic Regression
  - Naive Bayes
  - SVM
  - Random Forest
  - XGBoost
- Preprocessed with `TfidfVectorizer`

---

## 🛠 Tech Stack

- **Frontend:** Next.js, Tailwind CSS
- **Backend:** Node.js (Express), Python (Scikit-learn, XGBoost)
- **Deployment:** Vercel (frontend), Render (backend)
- **Other Tools:** NewsAPI, Gemini API, TF-IDF vectorizer, Pickle, CORS

---

## 🧪 How to Run Locally

## Clone the repository:

```bash
git clone https://github.com/JoyBoy-00/Fake-News-Classification.git
cd Fake-News-Classification/
```

## ⚙️ Backend (Node.js + Python)

### Setup locally

```bash
cd backend
npm install
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
node server.js
```

## ⚙️ Backend (Node.js + Python)

### Setup locally

```bash
cd ..
npm install
npm run dev
```

---

## 👥 Contributors

- [JoyBoy-00](https://github.com/JoyBoy-00)
- [kunal-saw](https://github.com/kunal-saw)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).


