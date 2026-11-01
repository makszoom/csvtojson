import requests, re, os, base64

# Token from project .env
env = {}
with open(r'C:\Users\MiniPC\Projects\csvtojson\.env') as f:
    for line in f:
        if '=' in line:
            k, v = line.strip().split('=', 1)
            env[k] = v
TOKEN = env['GITHUB_TOKEN']
OWNER, REPO, BRANCH = 'makszoom', 'csvtojson', 'main'
headers = {'Authorization': f'token {TOKEN}', 'Accept': 'application/vnd.github.v3+json'}
base = f'https://api.github.com/repos/{OWNER}/{REPO}/contents'

FILES = {
    'seo/csv-to-json-for-gst.html': r'C:\Users\MiniPC\Projects\csvtojson\seo\csv-to-json-for-gst.html',
    'sitemap.xml': r'C:\Users\MiniPC\Projects\csvtojson\sitemap.xml',
}

for repo_path, local_path in FILES.items():
    with open(local_path, 'rb') as f:
        content = f.read()
    url = f'{base}/{repo_path}?ref={BRANCH}'
    r = requests.get(url, headers=headers)
    sha = r.json().get('sha') if r.status_code == 200 else None
    data = {
        'message': f'GST page: add CSV-in-portal section, Excel-to-JSON use cases, 2 FAQ (content pass 2026-09-20)',
        'content': base64.b64encode(content).decode(),
        'branch': BRANCH,
    }
    if sha:
        data['sha'] = sha
    r = requests.put(f'{base}/{repo_path}', headers=headers, json=data)
    print(repo_path, '->', r.status_code, r.json().get('commit', {}).get('sha', '')[:7] if r.status_code == 200 else r.text[:200])