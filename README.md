# Container Queries: All Aboard

An interactive demo of CSS container queries. Drag the handles to resize the
`.track` container and watch a toy train react to its own size, not the
viewport's.

- **Wider** couples on more cars at 480, 680, 880, and 1050px, and the engine's
  smoke trail grows and leans back the more cars it pulls.
- **Taller** adds smoke and kitchen steam at 310px, and a second deck at 390px.
- **Both** at once (1050 × 310) sets off a one-time toot from the engine.

Every visual change is plain CSS reacting to `@container` queries. The
breakpoint ruler and level lines live inside the container too, so the same
queries light them up. JavaScript only handles dragging, keyboard input, the
size label, and scaling the scene to fit the screen.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```sh
npx serve .
```

Add `?w=1080&h=440` to the URL to start at a specific track size.

## Notes

- Motion follows Emil Kowalski's [animations.dev](https://animations.dev)
  guidance, and everything respects `prefers-reduced-motion`.
- Colors come from the Tailwind palette and live as tokens at the top of
  `styles.css`. The train SVGs draw their outlines with `currentColor`, so
  `--ink` recolors them too.
