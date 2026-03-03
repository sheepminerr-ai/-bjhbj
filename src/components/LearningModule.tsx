import React, { useState, useEffect } from 'react';
import { GeneratedSite, Step, generateIllustration } from '../services/gemini';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CheckCircle, Circle, ChevronRight, ChevronLeft, Image as ImageIcon, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

interface LearningModuleProps {
  module: GeneratedSite;
}

export function LearningModule({ module }: LearningModuleProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStep = module.steps[currentStepIndex];
  const isLastStep = currentStepIndex === module.steps.length - 1;

  const handleNext = () => {
    setCompletedSteps(new Set([...completedSteps, currentStepIndex]));
    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 flex flex-col h-auto md:h-screen md:sticky top-0 overflow-y-auto">
        <h1 className="text-xl font-bold tracking-tight mb-2 text-indigo-600 dark:text-indigo-400">
          {module.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          {module.summary}
        </p>
        
        <nav className="space-y-1">
          {module.steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = completedSteps.has(index);
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(index)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className={clsx("w-4 h-4 shrink-0", isActive ? "text-indigo-500" : "text-slate-300 dark:text-slate-600")} />
                )}
                <span className="truncate">{step.title}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="mb-8">
                <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                  {currentStep.type}
                </span>
                <h2 className="text-3xl font-bold tracking-tight">
                  {currentStep.title}
                </h2>
              </div>

              <StepRenderer step={currentStep} />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer Navigation */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 flex items-center justify-between sticky bottom-0">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition-all active:scale-95"
          >
            {isLastStep ? 'Finish' : 'Next Step'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </footer>
      </div>
    </div>
  );
}

function StepRenderer({ step }: { step: Step }) {
  return (
    <div className="space-y-8">
      {step.content && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
          <MarkdownRenderer content={step.content} />
        </div>
      )}

      {step.type === 'quiz' && step.quiz && (
        <QuizRenderer quiz={step.quiz} />
      )}

      {step.type === 'practice' && step.practice && (
        <PracticeRenderer practice={step.practice} />
      )}

      {step.type === 'illustration' && step.illustrationPrompt && (
        <IllustrationRenderer prompt={step.illustrationPrompt} />
      )}
    </div>
  );
}

function QuizRenderer({ quiz }: { quiz: NonNullable<Step['quiz']> }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === quiz.correctAnswerIndex;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
      <h3 className="text-lg font-semibold mb-6">{quiz.question}</h3>
      <div className="space-y-3">
        {quiz.options.map((option, idx) => {
          const isSelected = selected === idx;
          const showCorrect = submitted && idx === quiz.correctAnswerIndex;
          const showIncorrect = submitted && isSelected && !isCorrect;

          return (
            <button
              key={idx}
              onClick={() => !submitted && setSelected(idx)}
              disabled={submitted}
              className={clsx(
                'w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all',
                !submitted && isSelected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-500'
                  : !submitted
                  ? 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  : '',
                showCorrect && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
                showIncorrect && 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-900 dark:text-red-100',
                submitted && !showCorrect && !showIncorrect && 'border-slate-200 dark:border-slate-800 opacity-50'
              )}
            >
              <div className="flex-1 text-left"><MarkdownRenderer content={option} /></div>
              {showCorrect && <Check className="w-5 h-5 text-emerald-500 shrink-0 ml-3" />}
              {showIncorrect && <X className="w-5 h-5 text-red-500 shrink-0 ml-3" />}
            </button>
          );
        })}
      </div>

      {!submitted && selected !== null && (
        <button
          onClick={() => setSubmitted(true)}
          className="mt-6 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
        >
          Check Answer
        </button>
      )}

      {submitted && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={clsx(
            'mt-6 p-4 rounded-xl text-sm',
            isCorrect ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' : 'bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-200'
          )}
        >
          <p className="font-semibold mb-1">{isCorrect ? 'Correct!' : 'Incorrect.'}</p>
          <MarkdownRenderer content={quiz.explanation} />
        </motion.div>
      )}
    </div>
  );
}

function PracticeRenderer({ practice }: { practice: NonNullable<Step['practice']> }) {
  const [showSolution, setShowSolution] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Practice Problem</h3>
        <MarkdownRenderer content={practice.problem} />
      </div>

      {practice.hints && practice.hints.length > 0 && (
        <div className="space-y-3 mb-8">
          {practice.hints.map((hint, idx) => (
            <div key={idx}>
              {idx < revealedHints ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-900 dark:text-amber-200 text-sm">
                  <span className="font-semibold mr-2">Hint {idx + 1}:</span>
                  <MarkdownRenderer content={hint} />
                </div>
              ) : idx === revealedHints ? (
                <button
                  onClick={() => setRevealedHints(prev => prev + 1)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  Show Hint {idx + 1}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {!showSolution ? (
        <button
          onClick={() => setShowSolution(true)}
          className="px-6 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Show Solution
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800"
        >
          <h4 className="font-semibold mb-4 text-emerald-600 dark:text-emerald-400">Solution</h4>
          <MarkdownRenderer content={practice.solution} />
        </motion.div>
      )}
    </div>
  );
}

function IllustrationRenderer({ prompt }: { prompt: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchImage() {
      setLoading(true);
      setError(null);
      try {
        const url = await generateIllustration(prompt);
        if (isMounted) setImageUrl(url);
      } catch (err) {
        console.error(err);
        if (isMounted) setError("Failed to generate illustration.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchImage();
    return () => { isMounted = false; };
  }, [prompt]);

  return (
    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[300px] overflow-hidden relative">
      {loading && (
        <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
          <ImageIcon className="w-8 h-8 mb-3 animate-pulse" />
          <span className="text-sm font-medium">Generating illustration...</span>
        </div>
      )}
      {error && (
        <div className="text-red-500 text-sm font-medium p-4 text-center">
          {error}
        </div>
      )}
      {imageUrl && !loading && (
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          src={imageUrl}
          alt="Generated illustration"
          className="w-full h-auto rounded-xl shadow-sm"
        />
      )}
    </div>
  );
}
