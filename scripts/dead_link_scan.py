#!/usr/bin/env python3
"""全站死链扫描：提取所有 HTML 中的内链，检查目标文件是否存在。"""
import os, re, sys
from urllib.parse import urljoin, unquote, urlparse
from collections import defaultdict

ROOTS = [
    "/Users/jinzhanxiang/Documents/tianbao-projects",
    "/Users/jinzhanxiang/Documents/tianbao-kg",
]
SKIP_DIRS = {'.git', 'node_modules', '__pycache__', 'screenshots', 'backups', 'data', 'industries', 'build'}
EXCLUDE_PATTERNS = ['cdn.jsdelivr', 'unpkg.com', 'googleapis.com', 'cloudflare', 'github.com', 'fonts.googleapis', 'fonts.gstatic', 'fonts.gstatic.com']

href_re = re.compile(r'(?:href|src)\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)

def is_internal(path):
    path = path.strip()
    if not path:
        return False
    if path.startswith(('http://', 'https://', 'mailto:', 'tel:', 'javascript:', 'blob:', 'data:')):
        return False
    if path.startswith(('?', '#')):
        return False
    if re.match(r'^\.\.\.?$|^[\.\,\-]$', path):
        return False
    if re.search(r'[^a-zA-Z0-9/\.\-\_\:~\(\)\[\]\'\"\s]', path):
        return False
    for p in EXCLUDE_PATTERNS:
        if p in path:
            return False
    return True

def resolve_link(src_file, link, root):
    """Resolve link relative to src_file, return filesystem path. Reject non-relative and template literals."""
    if link.startswith(('javascript:', 'mailto:', 'tel:', 'blob:', 'data:')):
        return None
    # Reject JS template literals and regex fragments
    if re.search(r'\$\{|/|[^\'"a-zA-Z0-9/\.\-\_\:~\(\)\[\]\s]', link) and ('{' in link or '[' in link):
        return None
    # Build file-based URL for urljoin
    file_url = "file://" + os.path.abspath(src_file)
    joined = urljoin(file_url, link)
    parsed = urlparse(joined)
    # Must be file:// protocol
    if parsed.scheme != 'file':
        return None
    fpath = parsed.path
    if not fpath.startswith('/'):
        fpath = '/' + fpath
    fpath = unquote(fpath)
    # Strip query and fragment already done by split
    # Check file exists
    return fpath if os.path.isfile(fpath) else fpath  # return path regardless, caller checks exists

def scan_file(filepath, root):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception:
        return []
    links = []
    for m in href_re.finditer(content):
        raw = m.group(1).strip()
        if not raw or raw == '#':
            continue
        if is_internal(raw):
            resolved = resolve_link(filepath, raw, root)
            if resolved is not None:
                links.append((raw, resolved))
    return links

def find_html_files(root):
    files = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn.lower().endswith(('.html', '.htm')):
                files.append(os.path.join(dirpath, fn))
    return sorted(files)

# Run
all_results = []
total_links = 0
html_count = 0
for root in ROOTS:
    html_files = find_html_files(root)
    html_count += len(html_files)
    for hf in html_files:
        links = scan_file(hf, root)
        rel_src = os.path.relpath(hf, os.path.dirname(root))
        for raw, resolved in links:
            total_links += 1
            if not os.path.isfile(resolved):
                all_results.append({
                    'source': rel_src,
                    'link': raw,
                    'resolved': resolved,
                })

print(f"=== 全站死链扫描完成 ===")
print(f"扫描根目录: {len(ROOTS)}")
print(f"HTML 文件数: {html_count}")
print(f"总内链数: {total_links}")
print(f"死链数: {len(all_results)}")
print()
if all_results:
    by_source = defaultdict(list)
    for r in all_results:
        by_source[r['source']].append(r)
    for src, links in sorted(by_source.items()):
        print(f"【{src}】({len(links)} 死链)")
        for l in links[:15]:
            print(f"  ❌ '{l['link']}' → {l['resolved']}")
        if len(links) > 15:
            print(f"  ... 还有 {len(links)-15} 个")
        print()
else:
    print("✅ 无死链")
sys.exit(0 if not all_results else 1)
