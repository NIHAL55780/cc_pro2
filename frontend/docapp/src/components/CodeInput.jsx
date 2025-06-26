import { useState } from 'react';

function CodeInput({ onSubmit, onGitHubSubmit }) {
    const [code, setCode] = useState('');
    const [githubUrl, setGitHubUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCodeSubmit = (e) => {
        e.preventDefault();
        if (!code.trim()) return;

        setIsProcessing(true);
        onSubmit(code).finally(() => setIsProcessing(false));
    };

    const handleGitHubSubmit = async (e) => {
        e.preventDefault();
        if (!githubUrl.trim()) return;

        setIsProcessing(true);
        onGitHubSubmit(githubUrl).finally(() => setIsProcessing(false));
    };

    return (
        <div className="code-input-container">
            <h2>Paste Your Code or Provide GitHub URL</h2>

            {/* Paste Code Section */}
            <form onSubmit={handleCodeSubmit}>
                <textarea
                    className="code-textarea"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your code here..."
                    rows={10}
                />
                <button
                    type="submit"
                    className="submit-button"
                    disabled={isProcessing || !code.trim()}
                >
                    {isProcessing ? 'Generating...' : 'Generate from Code'}
                </button>
            </form>

            {/* GitHub URL Section */}
            <form onSubmit={handleGitHubSubmit} style={{ marginTop: '2rem' }}>
                <input
                    type="url"
                    className="github-url-input"
                    placeholder="Paste GitHub repo URL (e.g. https://github.com/user/repo)"
                    value={githubUrl}
                    onChange={(e) => setGitHubUrl(e.target.value)}
                    style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                />
                <button
                    type="submit"
                    className="submit-button"
                    disabled={isProcessing || !githubUrl.trim()}
                >
                    {isProcessing ? 'Generating...' : 'Generate from GitHub URL'}
                </button>
            </form>
        </div>
    );
}

export default CodeInput;
