"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [result, setResult] = useState<null | {
    text: string;
    accuracy: string;
    category: string;
  }>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [enrichedNews, setEnrichedNews] = useState<any[]>([]);
  const newsInputRef = useRef<HTMLTextAreaElement>(null);

  const handlePrediction = async () => {
    const newsInput = newsInputRef.current?.value || "";

    if (newsInput.trim() === "") {
      alert("Please enter the news content.");
      return;
    }

    // 🔍 1. Send news to backend model
    const modelResponse = await fetch("http://localhost:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ texts: [newsInput] }),
    });

    const modelData = await modelResponse.json();
    const modelPrediction = modelData.predictions?.[0] || "Unknown";
    console.log("modelData:", modelData);
    console.log("modelPrediction:", modelPrediction);

    // 🎯 2. Send news to Gemini for categorization
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_KEY;
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Classify this news into a category (Political, Historical, Geographical, Sports or Other), 
                          give reply in 1 word and no other info: ${newsInput}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const geminiData = await geminiResponse.json();
    const geminiOutput =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "Other";

    // 🎲 Just to simulate confidence (optional)
    const accuracy = (Math.random() * 100).toFixed(2);

    setResult({
      text: modelPrediction.toUpperCase(),
      accuracy: `The news is ${accuracy}% real`,
      category: geminiOutput,
    });

    // 📰 3. Fetch top 5 articles from NewsAPI and analyze with Gemini
    const newsApiKey = process.env.NEXT_PUBLIC_NEWSAPI_KEY;
    console.log("🧪 News API Key:", newsApiKey);

    if (!newsApiKey) {
      console.error("🚨 Missing NewsAPI key. Check .env.local and NEXT_PUBLIC_NEWSAPI_KEY");
      return;
    }

    const newsResponse = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&pageSize=5&apiKey=${newsApiKey}`
    );
    const newsData = await newsResponse.json();

    if (!newsData.articles) {
      console.error("🚨 No articles returned from NewsAPI", newsData);
      return;
    }

    const enriched = await Promise.all(
      newsData.articles.map(async (article: any) => {
        const title = article.title || "";
        const content = article.content || article.description || "";
        const fullText = `${title}. ${content}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Given this article content: \"${fullText}\", \nUser input was: \"${newsInput}\", and model predicted: \"${modelPrediction}\",\nClassify it (Political, Historical, Geographical, Sports, Other) and estimate fakeness percentage. \nReply: Category: <category>. Fakeness: <percent>%`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        const geminiJson = await geminiRes.json();
        const outputText =
          geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        const categoryMatch = outputText.match(/Category:\s*(\w+)/i);
        const fakenessMatch = outputText.match(/Fakeness:\s*(\d+)%/i);

        return {
          title,
          content,
          geminiCategory: categoryMatch?.[1] || "Unknown",
          fakeness: fakenessMatch?.[1] || "Unknown",
        };
      })
    );

    setEnrichedNews(enriched);
  };

  return (
    <div
      className={`min-h-screen py-12 px-4 ${darkMode ? "bg-zinc-900 text-white" : "bg-white text-black"
        } transition-colors`}
    >
      <div className="max-w-xl mx-auto text-center space-y-6">
        <h1 className="text-3xl font-bold">Fake News Prediction</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Check if the news is real or fake!
        </p>

        <textarea
          ref={newsInputRef}
          placeholder="Enter the news here..."
          className={`w-full h-32 p-4 rounded-lg border border-gray-300 dark:border-gray-600 ${darkMode ? "bg-zinc-800 text-white" : "bg-zinc-100 text-black"
            } focus:outline-none`}
        />

        <button
          onClick={handlePrediction}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Predict
        </button>

        {result && (
          <div className="mt-8 space-y-4">
            <h2
              className={`text-2xl font-semibold ${result.text === "FAKE" ? "text-red-500" : "text-green-400"
                }`}
            >
              {result.text}
            </h2>

            <div className="w-full bg-gray-300 dark:bg-gray-700 h-4 rounded-md overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width: result.accuracy.match(/[\d.]+/)?.[0] + "%",
                }}
              ></div>
            </div>

            <p className="text-sm">{result.accuracy}</p>
            <p className="text-sm font-medium">Category: {result.category}</p>

            <p className="text-sm text-gray-400">
              Give us some feedback if we predicted it wrong:
            </p>

            <div className="flex justify-center gap-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                Real
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
                Fake
              </button>
            </div>

            {enrichedNews.length > 0 && (
              <div className="mt-10 space-y-4 text-left">
                <h3 className="text-xl font-semibold">Top 5 News Analysis</h3>
                {enrichedNews.map((item, index) => (
                  <div
                    key={index}
                    className="border p-4 rounded-md shadow bg-zinc-50 dark:bg-zinc-800"
                  >
                    <h4 className="font-bold">{item.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.content}
                    </p>
                    <p className="text-sm mt-1">
                      Category: <strong>{item.geminiCategory}</strong>, Fakeness: <strong>{item.fakeness}%</strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-2">
          <label htmlFor="darkModeToggle" className="text-sm font-medium">
            Dark Mode
          </label>
          <input
            id="darkModeToggle"
            type="checkbox"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
            className="h-4 w-4"
          />
        </div>
      </div>
    </div>
  );
}