import { useMemo, useRef, useState } from "react"
import { computeOdds, type OddsMode } from "../utils/computeOdds"

type Props = {
	items: string[]
	colors: string[]
	totals: Record<string, number>
	onResult?: (
		value: string,
		index: number,
		amount: number,
		shieldUsedBy: string[]
	) => void
	// shields
	shieldsEnabled?: boolean
	activeShields?: boolean[]
	hasShields?: boolean[]
	onBurnShields?: (indices: number[]) => void
	onOddsUpdate?: (odds: number[]) => void
}

export default function Wheel({
	items, colors, totals, onResult,
	shieldsEnabled = false,
	activeShields = [],
	hasShields = [],
	onBurnShields,
	onOddsUpdate
}: Props) {
	const [rotation, setRotation] = useState(0)
	const [spinning, setSpinning] = useState(false)
	const [amount, setAmount] = useState<number>(0)
	const [mode, setMode] = useState<OddsMode>("aggressive")
	const wheelRef = useRef<HTMLDivElement>(null)
	const shieldSnapshotRef = useRef<Set<number> | null>(null) // active shields at spin start

	/*
	// weights based on totals + typed amount (preview effect)
	const { percentages, segAngles } = useMemo(() => {
		if (!items.length) return { percentages: [] as number[], segAngles: [] as number[] }
		const afterTotals = items.map((name) => (totals[name] || 0) + (amount || 0))
		const weights = afterTotals.map((v) => {
			const x = v + 1
			if (mode === "mild") return 1 / Math.sqrt(x)
			if (mode === "aggressive") return 1 / Math.pow(x, 2)
			return 1 / x
		})
		const sum = weights.reduce((a, b) => a + b, 0) || 1
		const perc = weights.map((w) => w / sum)
		const angles = perc.map((p) => p * 360)
		return { percentages: perc, segAngles: angles }
	}, [items, totals, amount, mode])

	*/

	const { percentages, angles: segAngles } = useMemo(() => {
		const result = computeOdds(items, totals, amount, mode)
		onOddsUpdate?.(result.percentages)
		return result
	}, [items, totals, amount, mode, onOddsUpdate])

	const gradient = useMemo(() => {
		let a = 0
		const parts: string[] = []
		items.forEach((_, i) => {
			const start = a
			a += segAngles[i] || 0
			const color = colors[i % colors.length] || "#ccc"
			parts.push(`${color} ${start}deg ${a}deg`)
		})
		return `conic-gradient(${parts.join(",")})`
	}, [items, colors, segAngles])

	function spin() {
		if (spinning || items.length === 0 || !amount) return
		setSpinning(true)

		// snapshot shields for this round (consumed whether picked or not)
		if (shieldsEnabled) {
			const indices: number[] = []
			for (let i = 0; i < items.length; i++) {
				if (activeShields[i] && hasShields[i]) indices.push(i)
			}
			shieldSnapshotRef.current = new Set(indices)
		} else {
			shieldSnapshotRef.current = new Set()
		}

		// weighted pick using current percentages
		const r = Math.random()
		let acc = 0
		let idx = 0
		for (let i = 0; i < percentages.length; i++) {
			acc += percentages[i]
			if (r <= acc) { idx = i; break }
		}

		// aim for center of the winning slice
		const start = segAngles.slice(0, idx).reduce((s, n) => s + n, 0)
		const center = start + (segAngles[idx] || 0) / 2

		const extra = 6
		const current = rotation % 360
		const target = rotation + extra * 360 + (360 - center) - current
		setRotation(target)

		const onEnd = () => {
			wheelRef.current?.removeEventListener("transitionend", onEnd)
			setSpinning(false)

			const snapshot = shieldSnapshotRef.current ?? new Set<number>()
			const shieldUsedByNames = Array.from(snapshot).map(i => items[i])

			// Burn all shields that were active this round
			if (snapshot.size) {
				onBurnShields?.(Array.from(snapshot))
			}
			shieldSnapshotRef.current = null

			if ("vibrate" in navigator) navigator.vibrate?.(50)
			new Audio("/ding.mp3").play().catch(() => { })

			// If winner had shield -> amount = 0
			const finalAmount = (shieldsEnabled && snapshot.has(idx)) ? 0 : amount

			onResult?.(items[idx], idx, finalAmount, shieldUsedByNames)
			setAmount(0)
		}
		wheelRef.current?.addEventListener("transitionend", onEnd, { once: true })
	}

	return (
		<div style={{ display: "grid", placeItems: "center", gap: 12 }}>
			<div style={{ position: "relative", width: 320, height: 320 }}>
				{/* pointer */}
				<div
					aria-hidden
					style={{
						position: "absolute",
						top: -6,
						left: "50%",
						transform: "translateX(-50%)",
						width: 0, height: 0,
						borderLeft: "10px solid transparent",
						borderRight: "10px solid transparent",
						borderTop: "18px solid #ff5252",
						zIndex: 2,
						filter: "drop-shadow(0 2px 2px rgba(0,0,0,.25))",
					}}
				/>
				{/* wheel */}
				<div
					ref={wheelRef}
					style={{
						width: "100%", height: "100%",
						boxSizing: "border-box",
						borderRadius: "50%",
						background: gradient,
						border: "10px solid #111",
						boxShadow: "0 10px 30px rgba(0,0,0,.25) inset, 0 6px 24px rgba(0,0,0,.2)",
						overflow: "hidden",
						transition: "transform 4s cubic-bezier(.15,.8,.1,1)",
						transform: `rotate(${rotation}deg)`,
						position: "relative",
					}}
				>
					{/* labels */}
					{items.map((label, i) => {
						const start = segAngles.slice(0, i).reduce((s, n) => s + n, 0)
						const center = start + (segAngles[i] || 0) / 2 - 90
						return (
							<div
								key={i}
								style={{
									position: "absolute",
									left: "50%", top: "50%",
									transform: `rotate(${center}deg) translate(0, -42%)`,
									transformOrigin: "0 0",
									textAlign: "center",
									width: "50%",
									fontSize: 14,
									fontWeight: 700,
									color: "#111",
									userSelect: "none",
								}}
							>
								<div style={{ transform: `rotate(${-center}deg)`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
									{label}
								</div>
							</div>
						)
					})}
				</div>
			</div>

			{/* controls */}
			<div style={{ display: "flex", gap: 8 }}>
				<select
					value={mode}
					onChange={(e) => setMode(e.target.value as OddsMode)}
					style={{ padding: 4, borderRadius: 8, border: "1px solid #ccc" }}
				>
					<option value="mild">Mild (light fairness)</option>
					<option value="normal">Normal</option>
					<option value="aggressive">Aggressive (strong fairness)</option>
				</select>
			</div>
			<div style={{ display: "flex", gap: 8 }}>
				<input
					type="number"
					value={amount || ""}
					onChange={(e) => setAmount(Number(e.target.value))}
					placeholder="Amount"
					style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc", textAlign: "center" }}
				/>
			</div>

			<button
				onClick={spin}
				disabled={spinning || !amount}
				style={{
					padding: "10px 16px",
					fontSize: 16,
					fontWeight: 700,
					borderRadius: 10,
					border: "none",
					background: spinning || !amount ? "#bbb" : "#111",
					color: "white",
					cursor: spinning || !amount ? "not-allowed" : "pointer",
				}}
			>
				{spinning ? "Spinning..." : "Spin"}
			</button>
		</div>
	)
}
