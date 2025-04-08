"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

// import { console } from "inspector";
import { useState, useRef  } from "react";
import React from "react";
// import { text } from "stream/consumers";
import Image from "next/image";

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
                          give reply in 1 word and no other info: ${newsInput}
                          give ans in this format only \nCategory: <category>`,
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
    console.log("Gemini Output:", geminiOutput);

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
    } else {
      console.log("Articles returned from NewsAPI", newsData);
    }

    const enriched = await Promise.all(
      newsData.articles.map(async (article: any) => {
        const title = article.title || "";
        const content = article.content || article.description || "";
        const fullText = `${title}. ${content}`;
        const url = article.url || "";
        const imageUrl = article.urlToImage || "";

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
                      text: `Given this article content: \"${fullText}\", \nUser input 
                      was: \"${newsInput}\", and model predicted: \"${modelPrediction}\",\nClassify it 
                      (Political, Historical, Geographical, Sports, Other) and estimate fakeness percentage. 
                      give ouput only the below format \n\n
                      \nReply: Category: <category>. Fakeness: <percent>%`,
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

        const fakenessValue = fakenessMatch ? parseInt(fakenessMatch[1]) : 50;

        console.log("Gemini Output:", outputText);
        console.log("Category Match:", categoryMatch);
        console.log("Fakeness Match:", fakenessMatch);

        return {
          title,
          content,
          url,
          imageUrl,
          geminiCategory: categoryMatch?.[1] || "Unknown",
          fakeness: fakenessValue,
        };
      })
    );

    setEnrichedNews(enriched);

    // 🎯 Calculate cumulative fakeness
    const avgFakeness =
      enriched.reduce((sum, article) => sum + article.fakeness, 0) /
      enriched.length;

    const isFake = modelPrediction.toUpperCase() === "FAKE";
    const finalScore = isFake
      ? avgFakeness.toFixed(2)
      : (100 - avgFakeness).toFixed(2);

    setResult({
      text: modelPrediction.toUpperCase(),
      accuracy: isFake
        ? `The news is ${finalScore}% fake`
        : `The news is ${finalScore}% real`,
      category: geminiOutput,
    });
  };

  return (
    <div
      className={`min-h-screen py-16 px-6 ${darkMode ? "bg-zinc-900 text-white" : "bg-white text-black"
        } transition-colors duration-500 ease-in-out`}
    >
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight">
          🧠 Fake News Detection
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Enter news content to determine its authenticity.
        </p>

        <textarea
          ref={newsInputRef}
          placeholder="Paste the news article here..."
          className={`w-full h-40 p-4 rounded-xl border shadow-sm resize-none text-sm leading-relaxed ${darkMode
            ? "bg-zinc-800 text-white border-zinc-700"
            : "bg-zinc-100 text-black border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
        />

        <button
          onClick={handlePrediction}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow transition duration-300"
        >
          🚀 Predict
        </button>

        {result && (
          <div className="mt-10 space-y-6">
            <h2
              className={`text-2xl font-bold tracking-wide ${result.text === "FAKE" ? "text-red-500" : "text-green-400"
                }`}
            >
              {result.text === "FAKE" ? "🚨 Fake News" : "✅ Real News"}
            </h2>

            <div className="w-full bg-gray-300 dark:bg-gray-700 h-5 rounded-lg overflow-hidden">
              <div
                className={`h-full ${result.text === "FAKE" ? "bg-red-500" : "bg-green-500"
                  } transition-all duration-500`}
                style={{
                  width: result.accuracy.match(/[\d.]+/)?.[0] + "%",
                }}
              ></div>
            </div>

            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {result.accuracy}
            </p>
            <p className="text-sm font-medium">📂 Category: {result.category}</p>

            {/* <p className="text-xs text-gray-500">
              Was our prediction correct? Let us know:
            </p>

            <div className="flex justify-center gap-4">
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
                Real
              </button>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
                Fake
              </button>
            </div> */}

            {enrichedNews.length > 0 && (
              <div className="mt-12 space-y-6 text-left">
                <h3 className="text-xl font-semibold mb-2">
                  🔍 Top 5 News Analysis
                </h3>
                {enrichedNews.map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 shadow-md dark:shadow-none bg-zinc-50 dark:bg-zinc-800 transition-all flex gap-4"
                  >
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt="news"
                        className="w-28 h-28 object-cover rounded-md"
                      />
                    )}

                    <div className="flex-1">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-blue-600 dark:text-blue-400"
                      >
                        <h4 className="font-bold text-lg mb-1 line-clamp-2">{item.title}</h4>
                      </a>

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {item.content}
                      </p>

                      <p className="text-sm mt-2">
                        📁 Category:{" "}
                        <strong className="capitalize">{item.geminiCategory}</strong> | 🎯
                        Fakeness:{" "}
                        <strong>
                          {item.fakeness !== "Unknown" ? `${item.fakeness}%` : "Unknown"}
                        </strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-12 flex items-center justify-center gap-2">
          <label htmlFor="darkModeToggle" className="text-sm font-medium">
            🌙 Dark Mode
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