"use client";

import { useState } from "react";
import LandingPage from "./components/LandingPage";
import QuizComponent from "./components/QuizComponent";
import ResultsPage from "./components/ResultsPage";

const questions = [
  {
    question: "What does CPU stand for?",
    options: [
      "Central Processing Unit",
      "Computer Personal Unit",
      "Central Processor Unit",
      "Central Personal Unit",
    ],
    correctAnswer: 0,
  },
  {
    question:
      "Which programming language is known as the 'mother of all languages'?",
    options: ["C", "Java", "Python", "Assembly"],
    correctAnswer: 0,
  },
  {
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Tech Modern Language",
      "Hyper Transfer Markup Language",
      "Home Tool Markup Language",
    ],
    correctAnswer: 0,
  },
  {
    question: "Which company developed the first smartphone?",
    options: ["Apple", "Samsung", "IBM", "Nokia"],
    correctAnswer: 2,
  },
  {
    question: "What is the smallest unit of digital information?",
    options: ["Byte", "Bit", "Nibble", "Word"],
    correctAnswer: 1,
  },
  {
    question: "Which of these is not a programming paradigm?",
    options: ["Object-Oriented", "Functional", "Procedural", "Alphabetical"],
    correctAnswer: 3,
  },
  {
    question: "What does GUI stand for?",
    options: [
      "Graphical User Interface",
      "General User Interaction",
      "Guided User Input",
      "Generated User Interface",
    ],
    correctAnswer: 0,
  },
  {
    question: "Which of these is not a cloud computing service model?",
    options: ["SaaS", "PaaS", "IaaS", "HaaS"],
    correctAnswer: 3,
  },
  {
    question: "What is the purpose of a firewall in computer networks?",
    options: [
      "Speed up internet connection",
      "Filter network traffic",
      "Increase storage capacity",
      "Enhance display resolution",
    ],
    correctAnswer: 1,
  },
  {
    question:
      "Which programming language is primarily used for iOS app development?",
    options: ["Java", "C#", "Swift", "Python"],
    correctAnswer: 2,
  },
];

export default function Quiz() {
  const [name, setName] = useState("");
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);

  const startQuiz = (playerName: string) => {
    setName(playerName);
    setQuizStarted(true);
  };

  const handleAnswer = (selectedAnswer: number) => {
    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 10);
    } else {
      setScore(Math.max(0, score - 2));
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizEnded(true);
    }
  };

  const restartQuiz = () => {
    setScore(0);
    setCurrentQuestion(0);
    setQuizStarted(false);
    setQuizEnded(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {!quizStarted && !quizEnded && <LandingPage startQuiz={startQuiz} />}
        {quizStarted && !quizEnded && (
          <QuizComponent
            question={questions[currentQuestion]}
            handleAnswer={handleAnswer}
            currentQuestion={currentQuestion}
            totalQuestions={questions.length}
          />
        )}
        {quizEnded && (
          <ResultsPage name={name} score={score} restartQuiz={restartQuiz} />
        )}
      </div>
    </div>
  );
}
