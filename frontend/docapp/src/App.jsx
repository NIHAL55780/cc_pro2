import { useState } from 'react';
import './App.css';
import CodeInput from './components/CodeInput';
import FileUpload from './components/FileUpload';
import DocumentationDisplay from './components/DocumentationDisplay';
import GithubInput from './components/GithubInput';
import {
  generateDocumentation,
  uploadFileForDocumentation,
  downloadDocumentation,
  generateFromGitHubUrl,
} from './services/api';

function App() {
  const [documentation, setDocumentation] = useState('');
  const [activeTab, setActiveTab] = useState('code'); // 'code', 'file', or 'github'
  const [error, setError] = useState('');
  const [currentCode, setCurrentCode] = useState(null);

  const handleCodeSubmit = async (code) => {
    try {
      setError('');
      const response = await generateDocumentation(code);
      setDocumentation(response.markdown);
      setCurrentCode(code);
    } catch (err) {
      setError(err.message || 'Failed to generate documentation.');
    }
  };

  const handleFileSubmit = async (file) => {
    try {
      setError('');
      const response = await uploadFileForDocumentation(file);
      setDocumentation(response.markdown);
      setCurrentCode(file);
    } catch (err) {
      setError(err.message || 'Failed to process file.');
    }
  };

  const handleGithubSubmit = async (url) => {
    try {
      setError('');
      const response = await generateFromGitHubUrl(url);
      setDocumentation(response.markdown);
      setCurrentCode(null);
    } catch (err) {
      setError(err.message || 'Failed to process GitHub URL.');
    }
  };

  const handleDownload = async () => {
    try {
      setError('');
      await downloadDocumentation(currentCode);
    } catch (err) {
      setError(err.message || 'Download failed.');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setDocumentation('');
    setError('');
    setCurrentCode(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Code Documentation Generator</h1>
        <p>Generate documentation from code, file, or GitHub URL</p>
      </header>

      <div className="tab-navigation">
        {['code', 'file', 'github'].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab === 'code' ? 'Paste Code' : tab === 'file' ? 'Upload File' : 'GitHub URL'}
          </button>
        ))}
      </div>

      <main className="app-content">
        <div className="input-section">
          {activeTab === 'code' && <CodeInput onSubmit={handleCodeSubmit} />}
          {activeTab === 'file' && <FileUpload onSubmit={handleFileSubmit} />}
          {activeTab === 'github' && <GithubInput onSubmit={handleGithubSubmit} />}

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="output-section">
          <DocumentationDisplay markdown={documentation} onDownload={handleDownload} />
        </div>
      </main>

      <footer className="app-footer">
        <p>Made by Team Daffodils</p>
      </footer>
    </div>
  );
}

export default App;
