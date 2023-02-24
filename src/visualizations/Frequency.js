import React, { useRef, useMemo, forwardRef } from "react"
import { useAtomValue } from "jotai"
import { useFrame } from "react-three-fiber"
import { motion } from 'framer-motion-3d'
import { useMotionValue } from "framer-motion"

import random from "canvas-sketch-util/random"
import times from 'lodash/times'
import { Vector3 } from "three"

import { streamAtom } from "../client-state"
import { mapRange } from '../utils/mapRange'
import { colorPallettes } from '../settings/colors'

// TODO - lowpass filter

const MAX_SCALE = 4
const MIN_SCALE = 0.2
const CENTER_VECTOR = new Vector3(0, 0, 0)
const DOTS_COUNT = 1000
const DOTS_SCALE_POWER = 3
const COLORS = colorPallettes[0]

export const Frequency = () => {
	const stream = useAtomValue(streamAtom)
	const { analyser, dataArray } = useFrequencySetup({ stream })
	const dotsRef = useRef([])
	random.setSeed('check')

	useFrame(() => {
		if (!dataArray.length) return
		if (!dotsRef.current?.length) return

		analyser.getByteFrequencyData(dataArray)

		dotsRef.current.forEach((dot, index) => {
			const scale = mapRange(
				Math.pow(dataArray[index % 32] / 255, DOTS_SCALE_POWER),
				0,
				1,
				MIN_SCALE,
				MAX_SCALE
			)

			dot.scale.x = scale
			dot.scale.y = scale
		})
	})

	return (
		<>
			{times(DOTS_COUNT).map((_, index) => (
				<Dot
					index={index}
					ref={(el) => (dotsRef.current[index] = el)}
					key={index}
				/>
			))}
		</>
	)
}

const Dot = forwardRef(({ index }, ref) => {
	const positionX = useMotionValue(random.range(-1, 1))
	const positionY = useMotionValue(random.range(-1, 1))

	const velocityX = useMotionValue(random.range(-0.005, 0.005))
	const velocityY = useMotionValue(random.range(-0.005, 0.005))
	const color = random.pick(COLORS)
	const positionVector = new Vector3(positionX.get(), positionY.get(), 0)

	useFrame(() => {
		const currentVelocityX = velocityX.get()
		const currentVelocityY = velocityY.get()
		const currentPositionX = positionX.get()
		const currentPositionY = positionY.get()

		const noiseX =
			random.noise3D(currentPositionX, currentPositionY, 0) * 1

		const newPositionX = currentPositionX + currentVelocityX * (1 + noiseX)
		const newPositionY = currentPositionY + currentVelocityY * (1 + noiseX)

		positionVector.set(newPositionX, newPositionY, 0)
		const collides = positionVector.distanceTo(CENTER_VECTOR) > 2


		velocityX.set(currentVelocityX * (collides ? -1 : 1))
		velocityY.set(currentVelocityY * (collides ? -1 : 1))

		positionX.set(newPositionX)
		positionY.set(newPositionY)
	})

	return (
		<motion.mesh
			x={positionX}
			y={positionY}
			z={0}
			ref={ref}
		>
			<circleGeometry args={[0.02, 32]} />
			<lineBasicMaterial color={color} />
		</motion.mesh>
	)
})

const useFrequencySetup = ({
	stream,
	fftSize = 32,
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
