#!/usr/bin/env python3
"""Copy tools/bowl_physics.js into src/worker.js and public/index.html.

The server and the page must run the exact same bowling physics, so the code lives in one file
and this script pastes it between the BOWL-PHYSICS markers in both places. Run it after editing the physics.
"""
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent
code = (root / 'tools' / 'bowl_physics.js').read_text().rstrip() + '\n'
A, B = '// BOWL-PHYSICS-START (generated from tools/bowl_physics.js by tools/sync_bowl.py; edit that file, not this copy)\n', '// BOWL-PHYSICS-END\n'
for rel in ('src/worker.js', 'public/index.html'):
    p = root / rel; s = p.read_text()
    i, j = s.index(A), s.index(B)
    s = s[:i + len(A)] + code + s[j:]
    p.write_text(s); print('synced', rel)
