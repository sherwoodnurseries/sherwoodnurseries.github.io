#!/usr/bin/env python3
"""
Update all HTML pages with the latest config.json values.
Run this after editing config.json:
    python3 update-config.py
"""
import json, glob

with open('config.json') as f:
    config = json.load(f)

config_json = json.dumps(config, separators=(',', ':'))
inline_tag = f'  <script>window.siteConfig={config_json};</script>\n'

for page in glob.glob('*.html'):
    with open(page, 'r') as f:
        html = f.read()

    # Remove old siteConfig line
    lines = html.split('\n')
    lines = [l for l in lines if 'siteConfig' not in l]
    html = '\n'.join(lines)

    # Insert new one before main.js
    html = html.replace(
        '  <script src="main.js"></script>',
        inline_tag + '  <script src="main.js"></script>'
    )

    with open(page, 'w') as f:
        f.write(html)

    print(f'Updated: {page}')

print('All pages updated with latest config.json')
