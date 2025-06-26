const API_BASE_URL = 'http://localhost:8000';

export async function generateDocumentation(code) {
  const response = await fetch(`${API_BASE_URL}/docs/gen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, isBase64: false }),
  });

  if (!response.ok) throw new Error((await response.json()).detail || 'Error generating docs');
  return response.json();
}

export async function uploadFileForDocumentation(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/docs/from-upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error((await response.json()).detail || 'Error processing file');
  return response.json();
}

export async function generateFromGitHubUrl(url) {
  const response = await fetch(`${API_BASE_URL}/docs/from-github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ github_url: url }),
  });

  if (!response.ok) throw new Error((await response.json()).detail || 'Error with GitHub URL');
  return response.json();
}

export async function downloadDocumentation(code, isBase64 = false) {
  const formData = new FormData();
  if (code instanceof File) formData.append('file', code);
  else {
    formData.append('code', code);
    formData.append('isBase64', isBase64);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/docs/download`, true);
    xhr.responseType = 'blob';

    xhr.onload = function () {
      if (xhr.status === 200) {
        const blob = new Blob([xhr.response], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code_documentation_${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        resolve();
      } else {
        reject(new Error('Download failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}
