import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  BookOpen,
  Brain,
  MessageCircle,
  FileText,
  Target,
  LayoutDashboard,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { askAI } from "./api";
import "./App.css";

const features = [
  {
    title: "AI Study Chat",
    description: "Ask academic questions and understand difficult concepts.",
    icon: MessageCircle,
    color: "purple",
    page: "AI Study Chat",
    heading: "Ask your study question",
    helper: "Ask an academic question and get a clear, step-by-step answer.",
    placeholder: "e.g. Explain DBMS normalization with an example...",
    button: "Ask StudyMate",
    aiFeature: "chat",
  },
  {
    title: "Notes Summarizer",
    description: "Convert lengthy study notes into concise summaries.",
    icon: FileText,
    color: "blue",
    page: "Notes Summarizer",
    heading: "Turn your notes into revision points",
    helper: "Paste your notes and StudyMate will organize the key ideas into a concise summary.",
    placeholder: "Paste your study notes here...",
    button: "Summarize Notes",
    aiFeature: "summarize",
  },
  {
    title: "Quiz Generator",
    description: "Practise topics with AI-generated multiple-choice questions.",
    icon: Brain,
    color: "orange",
    page: "Quiz Generator",
    heading: "Create a practice quiz",
    helper: "Enter a subject or topic to generate five multiple-choice questions with answers.",
    placeholder: "e.g. Operating system process management...",
    button: "Generate Quiz",
    aiFeature: "quiz",
  },
  {
    title: "Concept Explainer",
    description: "Learn difficult topics through simple explanations.",
    icon: BookOpen,
    color: "green",
    page: "Concept Explainer",
    heading: "Make a difficult concept simple",
    helper: "Enter a concept and get a beginner-friendly explanation with an example.",
    placeholder: "e.g. Explain recursion in C++...",
    button: "Explain Concept",
    aiFeature: "explain",
  },
  {
    title: "Study Recommendations",
    description: "Discover which topics you should revise next.",
    icon: Target,
    color: "pink",
    page: "Study Recommendations",
    heading: "Get a personalized study plan",
     helper: "Share your subjects, goals, available study time, and quiz scores for practical recommendations.",
    placeholder: "Describe your subjects, goals, difficult topics, available time, and recent quiz scores...",
    aiFeature: "recommend",
  },
];

function parseQuizQuestions(text) {
  const questionBlocks = text
    .split(/(?=###\s*\**\s*Question\s*\d+)/i)
    .filter((block) => /###\s*\**\s*Question\s*\d+/i.test(block));

  return questionBlocks.map((block) => {
    // Extract the question text.
    const questionMatch = block.match(
      /###\s*\**\s*Question\s*\d+\s*\**\s*([\s\S]*?)(?=\n\s*\*?\s*A\)|$)/i
    );

    const question = questionMatch?.[1]
      ?.replace(/\*\*/g, "")
      .trim() || "";

    // Extract options A, B, C, and D, including optional Markdown bullets.
    const options = ["A", "B", "C", "D"].map((letter) => {
      const pattern = new RegExp(
        `(?:^|\\n)\\s*\\*?\\s*${letter}\\)\\s*(.+)`,
        "i"
      );

      const match = block.match(pattern);

      return match
        ? match[1].replace(/\*\*/g, "").trim()
        : "";
    });

    // Extract the correct answer, even when the letter is bold.
    const answerMatch = block.match(
      /Correct Answer\s*:\s*\**\s*([A-D])\s*\**/i
    );

    // Extract the explanation.
    const explanationMatch = block.match(
      /Explanation\s*:\s*([\s\S]*?)(?=\n\s*---|\n\s*###\s*\**\s*Question|$)/i
    );

    return {
      question,
      options,
      correctAnswer: answerMatch
        ? answerMatch[1].toUpperCase()
        : "",
      explanation: explanationMatch
        ? explanationMatch[1].replace(/\*\*/g, "").trim()
        : "",
    };
  }).filter(
    (item) =>
      item.question &&
      item.options.every(Boolean) &&
      item.correctAnswer
  );
}
export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizSelections, setQuizSelections] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const requestIdRef = useRef(0);

  const activeFeature = features.find((feature) => feature.page === activePage);

  function openFeature(page) {
    // Ignore any response from a request started on the previous page.
    requestIdRef.current += 1;
    setActivePage(page);
    setSidebarOpen(false);
    setPrompt("");
    setQuestion("");
    setAnswer("");
    setError("");
    setQuizQuestions([]);
    setQuizSelections({});
    setQuizSubmitted(false);
    setLoading(false);
  }

  async function handleAskAI(feature, customPrompt) {
    const textToSend = (customPrompt ?? prompt).trim();
    if (loading) return;
    if (!textToSend) {
      setError("Please enter your question or study material first.");
      setAnswer("");
      return;
    }

    const thisRequestId = ++requestIdRef.current;
    setPrompt(textToSend);
    setLoading(true);
    setError("");
    setAnswer("");
    if (feature === "quiz") {
      setQuizQuestions([]);
      setQuizSelections({});
      setQuizSubmitted(false);
    }

    try {
      const result = await askAI(feature, textToSend);
      if (thisRequestId === requestIdRef.current) {
        setAnswer(result);
        if (feature === "quiz") {
          setQuizQuestions(parseQuizQuestions(result));
        }
      }
    } catch (err) {
      if (thisRequestId === requestIdRef.current) {
        const message = String(err?.message || "").toLowerCase();
        if (message.includes("429") || message.includes("rate limit") || message.includes("quota")) {
          setError("StudyMate is receiving too many requests right now. Please wait a minute and try again.");
        } else if (message.includes("503") || message.includes("overload") || message.includes("temporarily unavailable")) {
          setError("The AI service is temporarily busy. Please wait a moment and try again.");
        } else {
          setError("Unable to generate a response. Check your connection and try again.");
        }
      }
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  return (
    <div className="app">
      {sidebarOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <GraduationCap size={25} />
          </div>
          <div>
            <h2>StudyMate</h2>
            <span>AI Learning Assistant</span>
          </div>
          <button
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <button
          className={`nav-item ${activePage === "Dashboard" ? "active" : ""}`}
          onClick={() => openFeature("Dashboard")}
        >
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </button>

        <div className="nav-label">STUDY TOOLS</div>
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <button
              key={feature.page}
              className={`nav-item ${activePage === feature.page ? "active" : ""}`}
              onClick={() => openFeature(feature.page)}
            >
              <Icon size={19} />
              <span>{feature.title}</span>
            </button>
          );
        })}

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <Sparkles size={20} />
            <h4>Keep learning!</h4>
            <p>Small steps every day lead to big results.</p>
          </div>
          <p className="sidebar-footer">StudyMate · Mini Project 2026</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={23} />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-right">
            <div className="avatar">S</div>
            <span className="student-label">Student</span>
          </div>
        </header>

        {activePage === "Dashboard" ? (
          <div className="page-container">
            <section className="welcome-section">
              <div>
                <span className="eyebrow">
                  <Sparkles size={15} /> YOUR PERSONAL AI TUTOR
                </span>
                <h1>Learn smarter, not harder.</h1>
                <p>Welcome to StudyMate! What would you like to learn today?</p>
                <p className="welcome-description">Chat with an AI tutor, summarize notes, practise with quizzes, understand concepts, and plan your study time—all in one place.</p>
              </div>
              <div className="welcome-art">
                <GraduationCap size={76} strokeWidth={1.4} />
                <span className="art-sparkle sparkle-one">✦</span>
                <span className="art-sparkle sparkle-two">✧</span>
              </div>
            </section>

            <section className="section-heading">
              <div>
                <h2>Your study tools</h2>
                <p>Everything you need to make learning easier.</p>
              </div>
            </section>

            <section className="feature-grid">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <button
                    className="feature-card"
                    key={feature.page}
                    onClick={() => openFeature(feature.page)}
                  >
                    <div className={`feature-icon ${feature.color}`}>
                      <Icon size={24} />
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                    <div className="card-action">
                      <span>Explore tool</span>
                      <ArrowRight size={17} />
                    </div>
                  </button>
                );
              })}
            </section>

            <section className="quick-question">
              <div className="quick-question-icon">
                <MessageCircle size={23} />
              </div>
              <div className="quick-question-content">
                <h3>Have a question?</h3>
                <p>Ask your AI study assistant about any academic topic.</p>
                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const questionText = question.trim();
                    if (!questionText || loading) return;
                    openFeature("AI Study Chat");
                    await handleAskAI("chat", questionText);
                  }}
                >
                  <input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="e.g. Explain DBMS normalization..."
                    aria-label="Enter an academic question"
                  />
                  <button type="submit" disabled={loading || !question.trim()}>
                    {loading ? <><span className="loading-spinner" aria-hidden="true" /> Generating...</> : "Ask AI"}
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            </section>

            <footer className="page-footer">
              StudyMate — Your companion for smarter learning.
            </footer>
          </div>
        ) : (
          <div className="page-container tool-page">
            <button className="back-button" onClick={() => openFeature("Dashboard")}>
              ← Back to dashboard
            </button>

            <div className="tool-heading">
              <div className={`feature-icon ${activeFeature?.color || "purple"}`}>
                {activeFeature && (() => {
                  const Icon = activeFeature.icon;
                  return <Icon size={27} />;
                })()}
              </div>
              <div>
                <h1>{activeFeature?.title || activePage}</h1>
                <p>{activeFeature?.description}</p>
              </div>
            </div>

            <div className="coming-soon tool-workspace">
              <div className="coming-soon-icon">
                <Sparkles size={29} />
              </div>
              <h2>{activeFeature?.heading || "What would you like to learn?"}</h2>
              <p>{activeFeature?.helper || "Enter your study material below to get started."}</p>

              <textarea
                className="ai-input"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={activeFeature?.placeholder || "Enter your text here..."}
                rows={6}
              />

              <button
                onClick={() => handleAskAI(activeFeature?.aiFeature || "chat")}
                disabled={loading || !prompt.trim()}
              >
                {loading ? <><span className="loading-spinner" aria-hidden="true" /> Generating response...</> : (activeFeature?.button || "Ask StudyMate")}
              </button>

              {loading && <p className="ai-loading" role="status" aria-live="polite"><span className="loading-spinner" aria-hidden="true" />StudyMate is generating your response. This may take a few seconds...</p>}
              {error && <p className="ai-error" role="alert">{error}</p>}

              {answer && activePage === "Quiz Generator" && quizQuestions.length > 0 ? (
                <div className="ai-answer interactive-quiz">
                  <h3>Your Practice Quiz</h3>
                  <p>Select one answer for each question, then submit your quiz.</p>
                  {quizQuestions.map((item, index) => (
                    <section className="quiz-question" key={`${index}-${item.question}`}>
                      <h4>{index + 1}. {item.question}</h4>
                      <div className="quiz-options">
                        {item.options.map((option, optionIndex) => {
                          const letter = ["A", "B", "C", "D"][optionIndex];
                          const isCorrect = quizSubmitted && letter === item.correctAnswer;
                          const isWrongSelection = quizSubmitted && quizSelections[index] === letter && letter !== item.correctAnswer;
                          return (
                            <label
                              key={letter}
                              className={`quiz-option ${isCorrect ? "quiz-correct" : ""} ${isWrongSelection ? "quiz-incorrect" : ""}`}
                            >
                              <input
                                type="radio"
                                name={`quiz-${index}`}
                                value={letter}
                                checked={quizSelections[index] === letter}
                                disabled={quizSubmitted}
                                onChange={() => setQuizSelections((previous) => ({ ...previous, [index]: letter }))}
                              />
                              <span><strong>{letter})</strong> {option}</span>
                            </label>
                          );
                        })}
                      </div>
                      {quizSubmitted && (
                        <div className="quiz-explanation">
                          <strong>Correct answer: {item.correctAnswer}</strong>
                          {item.explanation && <p>{item.explanation}</p>}
                        </div>
                      )}
                    </section>
                  ))}
                  {!quizSubmitted ? (
                    <button
                      className="quiz-submit-button"
                      onClick={() => setQuizSubmitted(true)}
                      disabled={Object.keys(quizSelections).length !== quizQuestions.length}
                    >
                      Submit Quiz
                    </button>
                  ) : (
                    <div className="quiz-score">
                      <h3>Score: {quizQuestions.filter((item, index) => quizSelections[index] === item.correctAnswer).length} / {quizQuestions.length}</h3>
                      <button
                        onClick={() => {
                          setQuizSelections({});
                          setQuizSubmitted(false);
                        }}
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              ) : answer ? (
              <div className="ai-answer">
  <h3>
    {activePage === "Notes Summarizer"
      ? "Your Summary"
      : activePage === "Study Recommendations"
      ? "Your Study Recommendations"
      : "StudyMate's Answer"}
  </h3>

  <ReactMarkdown>{answer}</ReactMarkdown>
</div>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
