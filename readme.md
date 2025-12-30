# Disco Ball Shader Effect with WebGPU

A React Three Fiber (R3F) implementation of an interactive disco ball effect using WebGPU, compute shaders, and Three.js Shading Language (TSL).

[**Live Demo**](https://disco-ball.pages.dev/)

<img width="1372" height="1240" alt="image" src="https://github.com/user-attachments/assets/e8926d8f-815a-40ec-9e5d-fd17ea6175ea" />


## About

This project demonstrates how to create an interactive disco ball effect using WebGPU compute shaders and Three.js Shading Language (TSL). The effect features animated particle rotation, mouse interaction with raycasting, environment map sampling, and real-time material controls.

This is a personal practice project for learning WebGPU, compute shaders, and TSL (Three.js Shading Language).

## Original Tutorial

Based on the tutorial by Yuri Artiukh:
- [YouTube Tutorial](https://www.youtube.com/watch?v=KPP2wQbNUpE)

## Features

- **WebGPU Compute Shaders**: Real-time particle animation and position updates
- **Instanced Rendering**: Efficient rendering of thousands of particles
- **Interactive Raycasting**: Mouse/touch interaction that affects particle behavior
- **Environment Map Sampling**: Dynamic environment map reflection based on quantized normals
- **Real-time Controls**: Adjustable speed, time multiplier, roughness, and metalness via Leva
- **Look-at Rotation**: Particles automatically orient toward the camera
- **Distance-based Effects**: Particles react to mouse position with scaling animations

## Tech Stack

- React Three Fiber
- Three.js (WebGPU renderer)
- Three.js Shading Language (TSL)
- Leva (for UI controls)
- WebGPU Compute Shaders

## Getting Started

```bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev

# Build for production in the dist/ directory
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── DiscoBall.jsx          # Main component with setup and controls
│   └── utils/
│       ├── computeUtils.js     # Compute shader for particle animation
│       ├── materialUtils.js    # Material setup with environment mapping
│       ├── geometryUtils.js    # Geometry processing and instancing
│       └── raycastUtils.js     # Raycasting setup for mouse interaction
└── app/
    └── App.jsx                 # Main app component
```

## Controls

Use the Leva panel to adjust:
- **Speed**: Controls particle rotation speed (0-5)
- **Time Multiplier**: Controls animation speed (0-10)
- **Roughness**: Material roughness (0-1)
- **Metalness**: Material metalness (0-1)

## License

Personal practice project for educational purposes.
