import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface CodeEditorProps {
  language: string;
}

const getInitialCode = (lang: string) => {
  if (lang === 'html') {
    return '<!-- Write your HTML code here -->\n<h1>Hello, World!</h1>';
  }
  // Default to JS
  return '// Write your JavaScript code here\nconsole.log("Hello, World!");';
};


const CodeEditor: React.FC<CodeEditorProps> = ({ language }) => {
  const [code, setCode] = useState(() => getInitialCode(language));
  const [output, setOutput] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setCode(getInitialCode(language));
  }, [language]);


  const handleRunCode = () => {
    let fullHtml = '';

    if (language === 'html') {
       fullHtml = `
        <html>
          <head>
            <style>
              body { 
                font-family: sans-serif;
                color: #f0f0f0;
                background-color: #1a1a1a;
                padding: 1rem;
              }
            </style>
          </head>
          <body>${code}</body>
        </html>
      `;
    } else {
      // Default to JavaScript execution logic
      fullHtml = `
        <html>
          <head>
            <style>
              body { 
                font-family: monospace; 
                color: #f0f0f0;
                background-color: #1a1a1a;
              }
              .log { border-bottom: 1px solid #444; padding: 4px 0; word-break: break-all; }
              .error { color: #ff6b6b; }
            </style>
          </head>
          <body>
            <script>
              const oldLog = console.log;
              console.log = function(...args) {
                const output = args.map(arg => {
                  try {
                    return JSON.stringify(arg, null, 2)
                  } catch (e) {
                    return String(arg);
                  }
                }).join(' ');
                document.body.innerHTML += \`<div class="log">\${output.replace(/</g, "&lt;")}</div>\`;
                oldLog.apply(console, args);
              };
              try {
                ${code}
              } catch (e) {
                document.body.innerHTML += \`<div class="log error">\${String(e).replace(/</g, "&lt;")}</div>\`;
              }
            </script>
          </body>
        </html>
      `;
    }
    
    setOutput(fullHtml);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg border border-white/10">
      <div className="flex-grow p-1">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full bg-gray-900 text-white p-4 font-mono text-sm resize-none focus:outline-none"
          spellCheck="false"
        />
      </div>
      <div className="flex-shrink-0 p-2 border-t border-gray-700">
        <button
          onClick={handleRunCode}
          className="w-full py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <span>▶️</span> Run Code
        </button>
      </div>
      {isModalOpen && output && (
        <Modal title="Code Output" onClose={() => setIsModalOpen(false)}>
          <iframe
            srcDoc={output}
            title="output"
            sandbox="allow-scripts"
            className="w-full h-64 bg-gray-800 rounded"
          />
        </Modal>
      )}
    </div>
  );
};

export default CodeEditor;