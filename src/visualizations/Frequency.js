import React, { useRef,  useMemo } from "react"
import { streamAtom } from "../client-state"
import { useAtomValue } from "jotai"
import { useFrame, useThree } from "react-three-fiber"
import times from 'lodash/times'

export const Frequency = () => {
	const stream = useAtomValue(streamAtom)
	const { analyser, dataArray } = useSetup({ stream })
	const { size: {width, height }} = useThree()

	const dotsRef = useRef([])

	const dots = useMemo(() => times(dataArray.length, () => ({
			// Add initial scale?
			position: [Math.random(), Math.random(), 0]
		}))
	, [dataArray])


	useFrame(({ clock }) => {
		if (!dataArray.length) return
		if (!dotsRef.current?.length) return

		analyser.getByteFrequencyData(dataArray)

		 const time = clock.getElapsedTime()

		dotsRef.current.forEach((dot, index) => {
			// Add ease over this?
			const scale = mapRange(dataArray[index] / 255, 0, 1, 0, 5) + 1
			dot.scale.x = scale
			dot.scale.y = scale
		})
	})

	console.log({ dotsRef, dataArray, dots })

	return (
		<>
			<group>
				{[...dataArray].map((_, index) => (
					<mesh
						position={dots[index].position}
						key={index}
						ref={(el) => (dotsRef.current[index] = el)}
					>
						<circleGeometry args={[0.02, 32]} />
						<lineBasicMaterial color="yellow" />
					</mesh>
				))}
			</group>
		</>
	)
}

const useSetup = ({
	stream,
	fftSize = 64,
	smoothingTimeConstant = 0.9,
	minDecibels = -100,
	maxDecibels = -10,
}) => {
	const audioContext = useMemo(() => new AudioContext(), [])

	const source = audioContext.createMediaStreamSource(stream)
	const analyser = audioContext.createAnalyser()
	analyser.fftSize = fftSize
	analyser.smoothingTimeConstant = smoothingTimeConstant
	analyser.maxDecibels = maxDecibels
	analyser.minDecibels = minDecibels
	const bufferLength = analyser.frequencyBinCount

	const dataArray = useMemo(() => new Uint8Array(bufferLength), [bufferLength])
	analyser.getByteFrequencyData(dataArray)
	source.connect(analyser)

	return { audioContext, source, analyser, dataArray }
}

const mapRange = (
	n,
	start1,
	stop1,
	start2,
	stop2,
) => {
	return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2
}