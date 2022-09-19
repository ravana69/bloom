console.clear();

// Config
const DURATION = 10000;
const TURNS = 1.5;
const SPLITS_INITIAL = 16;
const SPLITS_FINAL = 32;

// Elements
const ringSelectors = ['.ring1', '.ring2', '.ring3', '.ring4', '.ring5', '.ring6'];
const ringElements = ringSelectors.map(selector => document.querySelector(selector));

// Helpers
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const map = (num, min, max, minTarget, maxTarget) => {
	const currentRatio = (num - min) / (max - min);
	return (maxTarget - minTarget) * currentRatio + minTarget;
};
const lerp = (a, b, p) => (b - a) * p + a;
const easeOut1_5 = p => 1 - ((1-p) ** 1.5);
const easeOut5 = p => 1 - ((1-p) ** 5);

// Gradient sampler factory.
// Creates an instance with a `sample(position)` method used to query a color from a specific position on the gradient.
// `position` is a number, where `0` is the start of the gradient and `1` is the end. Out-of-range values are wrapped.
// I experimented with this kind of gradient here: https://codepen.io/MillerTime/pen/NXxxma?editors=0010
const gradientSampler = (function GradientSamplerFactory() {
	// The instance to be returned.
	const sampler = {};

	// Gradient color stops in RGB format.
	// Note: does not currently wrap smoothly - this is by design.
	//       Perhaps a `wrap` flag could be added to `sample()` method.
	const colors = [
		{ r: 255, g: 232, b:   0 },
		{ r: 255, g: 103, b:   0 },
		{ r: 191, g:  26, b: 156 },
		{ r:   0, g:  79, b: 229 },
		{ r:   0, g: 196, b:   9 }
		// The real gradient continues from green back into orange and pink, but IMO it looks better without it.
		// { r: 247, g: 154, b:   0 },
		// { r: 243, g:  63, b: 149 }
	];

	const colorCount = colors.length;
	const colorSpans = colorCount - 1;
	const spanSize = 1 / colorSpans;

	sampler.sample = function sample(position) {
		// Normalize position to 0..1 scale (inclusive of 0, exlusive of 1).
		position -= position | 0;
		if (position < 0) position = 1 - position * -1;

		const startIndex = position * colorSpans | 0;
		const startColor = colors[startIndex];
		const endColor = colors[startIndex + 1];
		// Compute relative position between two chosen color stops.
		const innerPosition = (position - (startIndex / colorSpans)) / spanSize;

		const r = lerp(startColor.r, endColor.r, innerPosition) | 0;
		const g = lerp(startColor.g, endColor.g, innerPosition) | 0;
		const b = lerp(startColor.b, endColor.b, innerPosition) | 0;

		return `rgb(${r},${g},${b})`;
	};

	return sampler;
})();

// 200 is the diameter of the <circle> element
const ringCircumference = 200 * Math.PI;

// Style a ring, given the current animation time in milliseconds. Setting `flip` to `true` reverses rotation.
function styleRing(el, time, flip) {
	const progress = Math.max(0, time) % DURATION / DURATION;
	const delayedProgress = clamp(map(progress, 0, 1, -0.1, 1), 0, 1);
	el.style.stroke = gradientSampler.sample(easeOut1_5(progress));
	el.style.transform = `rotate(${flip ? '-' : ''}${progress ** 1.25 * TURNS}turn) scale(${progress ** 1.35 * 6})`;
	el.style.strokeWidth = lerp(200, 0, easeOut5(delayedProgress));
	const dash = lerp(ringCircumference / SPLITS_INITIAL, ringCircumference / (2*SPLITS_FINAL), easeOut5(delayedProgress));
	const gap = lerp(0, ringCircumference / (2*SPLITS_FINAL), easeOut5(delayedProgress));
	el.style.strokeDasharray = `${dash} ${gap}`;
}

let startTime = -1;

// Animation Loop
function tick(time) {
	if (startTime === -1) startTime = time;
	const timeFromZero = time - startTime;
	
	ringElements.forEach((ringEl, i) => {
		styleRing(ringEl, timeFromZero - DURATION / ringElements.length * i, i % 2 !== 0);
	});
	
	requestAnimationFrame(tick);
}

requestAnimationFrame(tick);