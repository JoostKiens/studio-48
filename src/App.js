import React, { useEffect } from "react"
import './App.css';
import { streamAtom } from './client-state';
import { useAtom } from 'jotai'
import { Canvas } from "react-three-fiber"
import { Frequency } from './visualizations/Frequency';

function App() {
  return (
		<div style={{ height: "100vh" }}>
			<MicrophoneAsStream>
				<Canvas
					style={{ backgroundColor: "black" }}
					camera={{ fov: 75, position: [0, 0, 2] }}
				>
					<Frequency />
					<ambientLight />
				</Canvas>
			</MicrophoneAsStream>
		</div>
	)
}

function MicrophoneAsStream({ children }) {
  const [stream, setStream] = useAtom(streamAtom)

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then(setStream)
  }, [setStream])

	// Can we use a hook and suspense here?
  return !!stream ? children: null
}


export default App