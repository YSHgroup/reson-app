import * as React from 'react'
import Particles from 'react-tsparticles'
import type { Container, Engine } from 'tsparticles-engine'
import { loadSlim } from 'tsparticles-slim'

const ParticlesComponent = ({ mode }) => {
  const particlesInit = React.useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])
  const particlesLoaded = React.useCallback(
    async (container: Container | undefined) => {
      // await console.log(container);
    },
    []
  )
  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={{
        background: {
          image:
            mode === 'default'
              ? "url('/images/background.jpg')"
              : mode === 'dark'
              ? 'radial-gradient(#4c638f,#022261)'
              : 'radial-gradient(#d2e2e1,#0d645f)',
        },
        fpsLimit: 120,
        interactivity: {
          events: {
            onClick: {
              enable: true,
              mode: 'repulse',
            },
            onHover: {
              enable: true,
              mode: 'repulse',
            },
            resize: true,
          },
          modes: {
            push: {
              quantity: 4,
            },
            repulse: {
              distance: 150,
              duration: 0.4,
            },
          },
        },
        particles: {
          color: {
            value: mode === 'dark' ? '#17346e' : mode === 'light'? '#52918c': '#4e96ba',
          },
          links: {
            color: mode === 'dark' ? '#17346e' : mode === 'light'? '#52918c': '#4e96ba',
            distance: 150,
            enable: true,
            opacity: 0.5,
            width: 1,
          },
          move: {
            direction: 'none',
            enable: true,
            outModes: {
              default: 'bounce',
            },
            random: false,
            speed: 4,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 60,
          },
          opacity: {
            value: 0.9,
          },
          shape: {
            type: 'circle',
          },
          size: {
            value: { min: 1, max: 5 },
          },
        },
        detectRetina: true,
      }}
    />
  )
}

export default ParticlesComponent
