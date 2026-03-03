import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { LearningModule } from './components/LearningModule';
import { generateLearningModule, GeneratedSite } from './services/gemini';
import { parseFile, ParsedFile } from './utils/fileParser';
import { Brain, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [problemText, setProblemText] = useState('');
  const [solutionText, setSolutionText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState<GeneratedSite | null>(null);

  const handleGenerate = async () => {
    if (!problemText.trim() && files.length === 0) {
      setError('Please provide a problem description or upload a file.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedFiles: ParsedFile[] = [];
      for (const file of files) {
        try {
          const parsed = await parseFile(file);
          parsedFiles.push(parsed);
        } catch (err) {
          console.error(`Failed to parse file ${file.name}`, err);
          throw new Error(`Failed to read file ${file.name}. Please ensure it's a supported format.`);
        }
      }

      const generatedModule = await generateLearningModule(
        problemText,
        solutionText,
        parsedFiles
      );
      setModule(generatedModule);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the learning module.');
    } finally {
      setLoading(false);
    }
  };

  if (module) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              Molecule Tutor
            </span>
          </div>
          <button
            onClick={() => setModule(null)}
            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Start Over
          </button>
        </header>
        <LearningModule module={module} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/50 selection:text-indigo-900 dark:selection:text-indigo-100 flex flex-col">
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-2">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">Molecule Tutor</span>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Break it down to <span className="text-indigo-600 dark:text-indigo-400">molecules</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Upload a complex problem or its solution. Our AI will analyze it and create a step-by-step interactive lesson to help you deeply understand and solve similar problems.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Problem Description
            </label>
            <textarea
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder="Paste the problem text here..."
              className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Solution (Optional)
            </label>
            <textarea
              value={solutionText}
              onChange={(e) => setSolutionText(e.target.value)}
              placeholder="Paste the solution if you have it..."
              className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Upload Files (Optional)
            </label>
            <FileUpload files={files} onFilesChange={setFiles} />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-200 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing & Generating Lesson...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Learning Module
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
