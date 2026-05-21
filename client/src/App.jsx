
import './index.css'
import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Folder,
  FileCode2,
  Play,
  Save,
  Eye,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export default function App() {
  const [openFolder, setOpenFolder] = useState(true);
  const [activeFile, setActiveFile] = useState("App.jsx");

  const files = ["App.jsx", "main.jsx", "index.css"];

  return (
    <div className="h-screen bg-[#e9eef3] flex flex-col overflow-hidden">
      {/* NAVBAR */}
      <div className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            C
          </div>

          <div>
            <h1 className="text-[17px] font-semibold text-gray-800">
              ATGCode
            </h1>
            <p className="text-[12px] text-gray-500">
              Browser IDE Sandbox
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <button className="px-4 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 transition-all text-sm font-medium flex items-center gap-2">
            <Save size={16} />
            Save
          </button>

          <button className="px-5 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all text-white text-sm font-medium flex items-center gap-2 shadow-md">
            <Play size={16} />
            Run Code
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-[18%] min-w-[250px] bg-white border-r border-gray-200 flex flex-col">
          {/* HEADER */}
          <div className="h-[55px] border-b border-gray-200 flex items-center px-5">
            <h2 className="text-sm font-semibold text-gray-700">
              Explorer
            </h2>
          </div>

          {/* FILES */}
          <div className="flex-1 overflow-auto p-3">
            <div>
              <div
                onClick={() => setOpenFolder(!openFolder)}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 cursor-pointer text-gray-700"
              >
                {openFolder ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}

                <Folder size={18} className="text-blue-500" />

                <span className="text-sm font-medium">src</span>
              </div>

              {openFolder && (
                <div className="ml-6 mt-2 flex flex-col gap-1">
                  {files.map((file) => (
                    <div
                      key={file}
                      onClick={() => setActiveFile(file)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                        activeFile === file
                          ? "bg-blue-100 text-blue-700"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <FileCode2 size={16} />
                      {file}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LIVE PREVIEW */}
          <div className="p-4 border-t border-gray-200">
            <button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 transition-all shadow-md">
              <Eye size={18} />
              Open Live Preview
            </button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TABS */}
          <div className="h-[50px] bg-white border-b border-gray-200 flex items-center px-4 gap-2">
            <div className="px-4 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center text-sm font-medium">
              {activeFile}
            </div>
          </div>

          {/* EDITOR */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              theme="vs-light"
              defaultLanguage="javascript"
              defaultValue={`function App() {
  return (
    <div>
      Hello World
    </div>
  )
}

export default App`}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                smoothScrolling: true,
                padding: {
                  top: 20,
                },
              }}
            />
          </div>

          {/* TERMINAL */}
          <div className="h-[30%] bg-[#f8fafc] border-t border-gray-200 flex flex-col">
            {/* TERMINAL TOP */}
            <div className="h-[45px] border-b border-gray-200 flex items-center px-4">
              <h2 className="text-sm font-semibold text-gray-700">
                Terminal
              </h2>
            </div>

            {/* TERMINAL BODY */}
            <div className="flex-1 p-4 overflow-auto font-mono text-sm text-gray-700">
              <p className="text-blue-600">$ npm run dev</p>

              <p className="mt-2 text-gray-600">
                VITE v5.4 ready in 320ms
              </p>

              <p className="mt-1 text-green-600">
                ➜ Local: http://localhost:5173
              </p>

              <p className="mt-1 text-green-600">
                ➜ Network: http://192.168.1.5:5173
              </p>

              <div className="mt-4 flex items-center">
                <span className="text-blue-600">$</span>

                <div className="w-[8px] h-[18px] bg-gray-500 ml-2 animate-pulse rounded-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}