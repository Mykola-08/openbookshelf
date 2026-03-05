# MagicGradient Component Guide

The `MagicGradient` is a high-performance wrapper around [ShaderGradient v2](https://shadergradient.co/), designed to bring cinema-quality moving backgrounds to the Kucherov Studio UI. It handles performance optimizations, theme switching, and simplified configuration automatically.

## Quick Usage

```jsx
import MagicGradient from '../components/common/MagicGradient';

// 1. Basic usage (Zinc/Blue theme auto-switch)
<MagicGradient />

// 2. Using a preset
<MagicGradient preset="ocean" />

// 3. Custom override
<MagicGradient 
  preset="warm" 
  uSpeed={0.5} 
  className="opacity-50" 
/>
```

## Presets

The component comes with built-in presets to quickly change the vibe without finding hex codes.

| Preset | Description | Colors | Vibe |
| :--- | :--- | :--- | :--- |
| `default` | **Architecture Clean**. Adaptive light/dark zinc. | Zinc-200, White, Blue-100 | Professional, Clean, Subtle |
| `neon` | **Cyberpunk**. High contrast, fast motion. | Magenta, Cyan, Yellow | Energetic, Bold, Attention-grabbing |
| `warm` | **Sunset**. Soft transitions. | Orange, Red, Yellow | Welcoming, Cozy, energetic |
| `ocean` | **Deep Sea**. Calming blues. | Cyan, Blue, Deep Teal | Trust, Calm, Stability |
| `zen` | **Minimalist**. Very low contrast. | Light Grays | Background, Neutral, texture-only |

### Using Presets

```jsx
<MagicGradient preset="neon" />
```

## Props API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `preset` | `string` | `null` | Name of a preset to apply base settings from (`default`, `neon`, `warm`, `ocean`, `zen`). |
| `color1` | `string` | `theme` | Primary gradient color. Hex code. |
| `color2` | `string` | `theme` | Secondary gradient color. Hex code. |
| `color3` | `string` | `theme` | Tertiary gradient color. Hex code. |
| `type` | `string` | `'plane'` | Shape of the gradient mesh. Options: `'plane'`, `'sphere'`, `'waterPlane'`. |
| `uSpeed` | `number` | `0.2` | Speed of the animation (0.0 - 1.0). |
| `uStrength` | `number` | `2` | Intensity of the noise/distortion. |
| `uDensity` | `number` | `1.2` | Density of the grain/noise clouds. |
| `animate` | `'on'` \| `'off'` | `'on'` | Toggle animation. Useful for reducing motion preference. |
| `cDistance` | `number` | `10` | Camera distance. Lower = more zoomed in. |
| `enableTransition` | `boolean` | `true` | Smoothly transition color changes. |

## Advanced Usage

### 1. Shape Variations (`type`)

You can change the geometry that the shader is applied to.

**Sphere (Globe Effect)**
Great for "planet" or "orb" visualizations.

```jsx
<div className="w-64 h-64 relative">
  <MagicGradient 
    type="sphere" 
    preset="ocean" 
    cDistance={3} // Zoom in for a contained sphere
  />
</div>
```

**Water Plane**
Simulates water surface ripples.

```jsx
<MagicGradient 
  type="waterPlane"
  uStrength={4} // Higher strength for waves
  uSpeed={0.3}
  color1="#60a5fa"
/>
```

### 2. Integration with Framer Motion

You can fade the gradient in/out or animate its container. Note that the canvas itself is heavy to re-mount, so prefer animating `opacity`.

```jsx
import { motion } from 'framer-motion';

<div className="relative group p-10">
  {/* Gradient fades in on hover */}
  <MagicGradient className="opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
  
  <div className="relative z-10">
    <h1>Content stays on top</h1>
  </div>
</div>
```

### 3. Creating New Presets

Edit `src/components/common/MagicGradient.jsx` to add new keys to `GRADIENT_PRESETS`.

```javascript
export const GRADIENT_PRESETS = {
  // ... existing
  'myNewPreset': {
    color1: '#123456',
    uSpeed: 0.8
  }
}
```

## Performance Notes

- **Pixel Density**: Hardcoded to `1` for performance on high-DPI screens.
- **Pointer Events**: `none` by default (it's a background).
- **Z-Index**: `-10` by default to stay behind content.
- **Context**: Requires WebGL context. Do not spam 50 of these on a single page. Use 1-3 strategic instances per view.
