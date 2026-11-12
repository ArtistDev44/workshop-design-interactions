# Génère les scènes de capture (compositions/*.html) à partir du découpage ci-dessous (voir SPEC.md / DERUSHAGE.md).
# Chaque plan = un extrait de assets/clips/partie-complete.mp4 (data-media-start), jamais une interface redessinée.
# plan : (début scène, durée, début dans la capture, échelle départ, échelle fin, origine x %, origine y %, vitesse)
SRC = 'assets/clips/partie-complete.mp4'
SCENES = {
  'accroche': dict(plans=[(0, 2.79, 34.0, 1.0, 1.22, 50, 32, 1)]),
  'tension': dict(plans=[(0, 0.93, 17.6, 1.25, 1.32, 50, 30, 1), (0.93, 0.93, 23.5, 1.5, 1.58, 55, 50, 1), (1.86, 0.93, 26.5, 1.5, 1.58, 55, 50, 1), (2.79, 0.93, 49.6, 1.6, 1.7, 25, 84, 1)],
                  titre=('titreSemaine', 'Une vraie semaine', 0.05, 2.75)),
  'revelation': dict(plans=[(0, 3.26, 42.3, 1.0, 1.12, 50, 30, 1)]),
  'preuve': dict(plans=[(0, 2.33, 51.3, 1.65, 1.75, 70, 28, 1), (2.33, 1.86, 56.0, 1.0, 1.1, 30, 70, 2), (4.19, 2.79, 80.2, 1.7, 1.8, 65, 62, 1), (6.98, 1.86, 83.3, 1.8, 1.9, 18, 4, 1), (8.84, 1.86, 204.8, 1.35, 1.45, 50, 45, 1)],
                 titre=('titreChoix', 'Chaque dossier, un choix', 6.98, 8.8)),
  # climax : 7 plans d'un temps puis le rapport de fin de semaine tenu deux temps
  'climax': dict(plans=[(i * 0.4651, 0.4651 if i < 7 else 4.18 - 7 * 0.4651, m, s0, s0 + 0.1, ox, oy, 1) for i, (m, s0, ox, oy) in enumerate([(127.0, 1.35, 70, 25), (130.5, 1.35, 70, 25), (150.5, 1.35, 70, 25), (190.8, 1.35, 45, 55), (194.5, 1.35, 50, 30), (203.0, 1.35, 50, 40), (175.0, 1.35, 50, 30), (349.3, 1.2, 55, 15)])], secousse=True),
}
for nom, sc in SCENES.items():
  plans = sc['plans']
  dur = max(p[0] + p[1] for p in plans)
  html = [f'''<template>
  <style>
    #root {{ position: absolute; inset: 0; background: var(--fond, #0d0c0c); overflow: hidden; }}
    #root .cam {{ position: absolute; inset: 0; }}
    #root video {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; object-fit: cover; }}
    #{nom}-titre {{ position: absolute; left: 96px; {'top' if nom == 'tension' else 'bottom'}: 96px; padding: 18px 28px; background: #d4031c; color: #ffffff;
      font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 64px; letter-spacing: -0.01em; }}
  </style>
  <div id="root" data-composition-id="{nom}" data-width="1920" data-height="1080">''']
  for i, (d, l, m, s0, s1, ox, oy, v) in enumerate(plans):
    rate = f' data-playback-rate="{v}"' if v != 1 else ''
    html.append(f'''    <div id="{nom}-cam{i}" class="cam" data-layout-allow-overflow style="transform-origin:{ox}% {oy}%"><video id="{nom}-v{i}" class="clip" src="{SRC}" muted playsinline data-start="{d:.3f}" data-duration="{l:.3f}" data-media-start="{m:.2f}"{rate} data-track-index="{i % 2}"></video></div>''')
  if 'titre' in sc:
    var, txt, t0, t1 = sc['titre']
    html.append(f'''    <div id="{nom}-titre" class="clip" data-start="{t0}" data-duration="{t1 - t0:.2f}" data-var-text="{var}">{txt}</div>''')
  html.append('  </div>\n  <script>\n    const tl = gsap.timeline({ paused: true });')
  for i, (d, l, m, s0, s1, ox, oy, v) in enumerate(plans):
    # punch-in : arrive légèrement grand (+6 %) et se pose en 0,3 s (expo.out), puis lente poussée linéaire jusqu'à la coupe
    html.append(f'''    tl.fromTo('#{nom}-cam{i}', {{ scale: {s0 * 1.06:.3f} }}, {{ scale: {s0:.3f}, duration: 0.3, ease: 'expo.out' }}, {d:.3f});
    tl.to('#{nom}-cam{i}', {{ scale: {s1:.3f}, duration: {max(0.05, l - 0.3):.3f}, ease: 'none' }}, {d + 0.3:.3f});''')
    if sc.get('secousse'):
      # secousse légère, déterministe : 3 px d'amplitude, 4 allers-retours sur le plan
      html.append(f'''    tl.fromTo('#{nom}-cam{i}', {{ x: 0, y: 0 }}, {{ keyframes: [{{ x: 3, y: -2 }}, {{ x: -2, y: 2 }}, {{ x: 2, y: 1 }}, {{ x: 0, y: 0 }}], duration: 0.2, ease: 'none' }}, {d:.3f});''')
  if 'titre' in sc:
    var, txt, t0, t1 = sc['titre']
    html.append(f'''    tl.fromTo('#{nom}-titre', {{ opacity: 0, filter: 'blur(8px)' }}, {{ opacity: 1, filter: 'blur(0px)', duration: 0.18, ease: 'power4.out' }}, {t0 + 0.05:.2f});
    tl.to('#{nom}-titre', {{ opacity: 0, filter: 'blur(6px)', duration: 0.15, ease: 'power3.in' }}, {t1 - 0.2:.2f});''')
  html.append(f"    window.__timelines['{nom}'] = tl;\n  </script>\n</template>\n")
  open(f'compositions/{nom}.html', 'w').write('\n'.join(html))
  print(nom, round(dur, 2))
