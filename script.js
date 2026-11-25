// JS only handles input, the size label, and fitting the rig to the screen.
// Which cars are coupled on, the smoke, the second deck, every poof, and which
// breakpoint marks are lit are all CSS reacting to the .track container.

const W = { min: 300, max: 1080 };
const H = { min: 230, max: 440 };
const STEP = 20;      // px per arrow-key press
const DRAG_SLOP = 3;  // px of movement before a press becomes a drag

const stage = document.querySelector('.stage');
const rig = document.querySelector('.rig');
const track = document.querySelector('.track');
const sizeLabel = document.querySelector('[data-size]');

// Start from ?w=&h= if given, otherwise from the size CSS gives the track.
const params = new URLSearchParams(location.search);
const size = {
  w: Number(params.get('w')) || track.clientWidth,
  h: Number(params.get('h')) || track.clientHeight,
};
let scale = 1;

const clamp = (v, lo, hi) => Math.round(Math.min(hi, Math.max(lo, v)));

// Scale the rig so that, with the track at its biggest, it fills the screen.
// The handles' and gaps' share of the rig is measured, so CSS stays the source
// of truth for their sizes; offset* values ignore the rig's own transforms.
function fit() {
  const extraW = rig.offsetWidth - track.clientWidth;
  const extraH = rig.offsetHeight - track.clientHeight;
  const railY = rig.offsetTop; // CSS pins the rails to 62% of the stage
  scale = Math.min(
    (stage.clientWidth - 48) / (W.max + extraW),
    (railY - 16) / (H.max + extraH),
  );
  stage.style.setProperty('--s', scale.toFixed(4));
}

function setSize(next, { animate = false } = {}) {
  size.w = clamp(next.w ?? size.w, W.min, W.max);
  size.h = clamp(next.h ?? size.h, H.min, H.max);
  track.classList.toggle('is-jumping', animate);
  track.style.width = `${size.w}px`;
  track.style.height = `${size.h}px`;
}

track.addEventListener('transitionend', (e) => {
  if (e.target === track && (e.propertyName === 'width' || e.propertyName === 'height')) {
    track.classList.remove('is-jumping');
  }
});

// The label follows the real rendered size, so it stays live mid-jump too.
new ResizeObserver(([entry]) => {
  const { inlineSize, blockSize } = entry.contentBoxSize[0];
  sizeLabel.textContent = `${Math.round(inlineSize)} × ${Math.round(blockSize)}`;
}).observe(track);

new ResizeObserver(fit).observe(stage);

// Dragging. Pointer deltas are divided by the rig's scale so the handle stays
// under the pointer. Width grows on both sides (2px per 1px of drag); height
// is anchored to the rails, so it grows 1:1.
function bindDrag(handle, onMove) {
  let start = null;

  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    // If a jump is mid-flight, pick up from wherever it is right now.
    const cs = getComputedStyle(track);
    start = { x: e.clientX, y: e.clientY, w: parseFloat(cs.width), h: parseFloat(cs.height) };
    setSize(start);
    handle.classList.add('is-pressed');
  });

  handle.addEventListener('pointermove', (e) => {
    if (!start || !handle.hasPointerCapture(e.pointerId)) return;
    // Press → lift: once the pointer really moves, the handle comes up off its ledge.
    if (!handle.classList.contains('is-dragging') &&
        Math.hypot(e.clientX - start.x, e.clientY - start.y) > DRAG_SLOP) {
      handle.classList.replace('is-pressed', 'is-dragging');
    }
    onMove(e, start);
  });

  const end = () => {
    start = null;
    handle.classList.remove('is-pressed', 'is-dragging');
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

// Keyboard steps are instant: no easing on keyboard actions.
function bindKeys(handle, axis, growKey, shrinkKey) {
  handle.addEventListener('keydown', (e) => {
    const delta = { [growKey]: STEP, [shrinkKey]: -STEP }[e.key];
    if (!delta) return;
    e.preventDefault();
    setSize({ [axis]: size[axis] + delta });
  });
}

for (const handle of document.querySelectorAll('.hx')) {
  const left = handle.dataset.side === 'left';
  const dir = left ? -1 : 1;
  bindDrag(handle, (e, s) => setSize({ w: s.w + ((e.clientX - s.x) / scale) * dir * 2 }));
  bindKeys(handle, 'w', left ? 'ArrowLeft' : 'ArrowRight', left ? 'ArrowRight' : 'ArrowLeft');
}

const topHandle = document.querySelector('.hy');
bindDrag(topHandle, (e, s) => setSize({ h: s.h - (e.clientY - s.y) / scale }));
bindKeys(topHandle, 'h', 'ArrowUp', 'ArrowDown');

// Clicking a breakpoint mark jumps the track to it.
for (const btn of document.querySelectorAll('[data-jump]')) {
  btn.addEventListener('click', () => {
    setSize({ [btn.dataset.axis]: Number(btn.dataset.jump) }, { animate: true });
  });
}

setSize({});

// Whatever is on the track when the page loads was already there: skip its
// entrance (poofs, toot, mark fades) so a refresh doesn't look like a coupling.
// Looping effects like smoke keep running.
for (const a of document.getAnimations()) {
  if (a.effect?.getTiming().iterations !== Infinity) a.finish();
}
