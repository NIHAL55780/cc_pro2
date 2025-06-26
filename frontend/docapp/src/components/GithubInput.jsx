import { useState } from 'react';

function GithubInput({ onSubmit }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    await onSubmit(url);
    setLoading(false);
  };

  return (
    <div className="github-input-container">
      <h2>Enter GitHub Repository URL</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/username/repo"
          className="github-url-input"
          required
        />
        <button type="submit" disabled={!url || loading}>
          {loading ? 'Processing...' : 'Generate Documentation'}
        </button>
      </form>
    </div>
  );
}

export default GithubInput;
