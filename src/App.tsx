import { useEffect, useMemo, useState } from "react"

import HistorySettings from "./components/HistorySettings";
import Wheel from "./components/Wheel";

type Player = { name: string; color: string; hasShield: boolean; activeShield: boolean }
export type HistoryItem = {
	name: string
	amount: number
	time: string
	shieldUsedBy: string[]
}

const PALETTE = [
	"#eb8b0eff", "#FFD166", "#06D6A0", "#118AB2",
	"#8E44AD", "#F78C6B", "#82C91E", "#E84393",
]

export default function App() {
	const DEFAULT_PLAYERS: Player[] = [
		{ name: "Oscar", color: PALETTE[0], hasShield: true, activeShield: false },
		{ name: "David", color: PALETTE[1], hasShield: true, activeShield: false },
		{ name: "Kristoffer", color: PALETTE[2], hasShield: true, activeShield: false },
		{ name: "Vilde", color: PALETTE[3], hasShield: true, activeShield: false },
		{ name: "Elsa", color: PALETTE[4], hasShield: true, activeShield: false },
	]

	const [history, setHistory] = useState<HistoryItem[]>(() => {
		try {
			const raw = localStorage.getItem("roulette_history_v1")
			return raw ? JSON.parse(raw) : []
		} catch { return [] }
	})

	const [players, setPlayers] = useState<Player[]>(() => {
		try {
			const raw = localStorage.getItem("roulette_players_v1")
			return raw ? JSON.parse(raw) : DEFAULT_PLAYERS
		} catch { return DEFAULT_PLAYERS }
	})

	const [shieldsEnabled, setShieldsEnabled] = useState<boolean>(() => {
		try {
			const raw = localStorage.getItem("roulette_shieldsEnabled_v1")
			return raw ? JSON.parse(raw) : true
		} catch { return true }
	})

	const [last, setLast] = useState<string | null>(null)
	const [page, setPage] = useState<"game" | "settings">("game")
	const [odds, setOdds] = useState<number[]>([])

	// add player form
	const [newName, setNewName] = useState("")
	const [newColor, setNewColor] = useState(PALETTE[players.length % PALETTE.length])

	const items = useMemo(() => players.map(p => p.name), [players])
	const colors = useMemo(() => players.map(p => p.color), [players])
	const activeShields = useMemo(() => players.map(p => p.activeShield), [players])
	const hasShields = useMemo(() => players.map(p => p.hasShield), [players])
	const totals = useMemo(() => {
		const acc: Record<string, number> = {}
		history.forEach(h => {
			acc[h.name] = (acc[h.name] || 0) + h.amount
		})
		return acc
	}, [history])

	useEffect(() => {
		try {
			const raw = localStorage.getItem("roulette_history_v1")
			if (raw) setHistory(JSON.parse(raw))
		} catch { }
	}, [])

	useEffect(() => {
		try {
			localStorage.setItem("roulette_history_v1", JSON.stringify(history))
		} catch { }
	}, [history])

	useEffect(() => {
		try {
			localStorage.setItem("roulette_players_v1", JSON.stringify(players))
			localStorage.setItem("roulette_shieldsEnabled_v1", JSON.stringify(shieldsEnabled))
		} catch { }
	}, [players, shieldsEnabled])

	useEffect(() => {
		try {
			const rp = localStorage.getItem("roulette_players_v1")
			const se = localStorage.getItem("roulette_shieldsEnabled_v1")
			if (rp) setPlayers(JSON.parse(rp))
			if (se) setShieldsEnabled(JSON.parse(se))
		} catch { }
	}, [])

	function handleResult(name: string, _index: number, amount: number, shieldUsedBy: string[] = []) {
		setLast(name)
		setHistory(prev => [
			{
				name,
				amount,
				time: new Date().toLocaleString(),
				shieldUsedBy,
			},
			...prev,
		])
	}

	// burn ALL shields that were active for this round (even if they didn't get picked)
	function consumeShields(indices: number[]) {
		if (!indices.length) return
		setPlayers(prev => prev.map((p, i) =>
			indices.includes(i) ? { ...p, hasShield: false, activeShield: false } : p
		))
	}

	function addPlayer() {
		const name = newName.trim()
		if (!name) return
		if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) return
		setPlayers(prev => [...prev, { name, color: newColor, hasShield: true, activeShield: false }])
		setNewName("")
		setNewColor(PALETTE[(players.length + 1) % PALETTE.length])
	}

	function removePlayer(name: string) {
		setPlayers(prev => prev.filter(p => p.name !== name))
		if (last === name) {
			setLast(null)
		}
	}

	function resetAll() {
		setHistory([])
		setPlayers(prev => prev.map(p => ({ ...p, hasShield: true, activeShield: false })))
		setLast(null)
	}

	function resetShields() {
		setPlayers(prev => prev.map(p => ({ ...p, hasShield: true, activeShield: false })))
	}

	function deleteLastHistoryEntry() {
		setHistory(prev => {
			if (prev.length === 0) return prev
			const [lastEntry, ...rest] = prev // newest first
			if (lastEntry.shieldUsedBy?.length) {
				setPlayers(players =>
					players.map(p =>
						lastEntry.shieldUsedBy.includes(p.name)
							? { ...p, hasShield: true, activeShield: false }
							: p
					)
				)
			}
			return rest
		})
	}

	if (page === "settings") {
		return (
			<div style={{ minHeight: "10dvh", display: "grid", placeItems: "center", gap: 12, padding: 16 }}>
				<div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
					<button onClick={() => setPage("game")}
						style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#6c2d6eff", color: "white" }}>
						Game
					</button>
					<button onClick={() => setPage("settings")}
						style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#fa64ffff", color: "white" }}>
						Settings / History
					</button>
				</div>
				<HistorySettings
					history={history}
					players={players.map(p => ({ name: p.name, color: p.color }))} // <-- add this
					shieldsEnabled={shieldsEnabled}
					onToggleShields={() => setShieldsEnabled(v => !v)}
					onReset={resetAll}
					onResetShields={resetShields}
					onDeleteLast={deleteLastHistoryEntry}
				/>
			</div>
		)
	}

	return (
		<div style={{ minHeight: "10dvh", display: "grid", placeItems: "center", gap: 12, padding: 16 }}>
			<div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
				<button onClick={() => setPage("game")}
					style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#fa64ffff", color: "white" }}>
					Game
				</button>
				<button onClick={() => setPage("settings")}
					style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#6c2d6eff", color: "white" }}>
					Settings / History
				</button>
			</div>

			<Wheel
				items={items}
				colors={colors}
				totals={totals}
				onResult={handleResult}
				// shields:
				shieldsEnabled={shieldsEnabled}
				activeShields={activeShields}
				hasShields={hasShields}
				onBurnShields={consumeShields}
				onOddsUpdate={setOdds}
			/>

			{/* Totals */}
			<div style={{ width: 320 }}>
				<h3>Players</h3>
				{players.map((p, i) => (
					<div
						key={p.name}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
							padding: "2px 4px",
							background: p.color,
							borderRadius: 4,
							marginBottom: 4,
							color: "#111",
							fontWeight: 600,
						}}
					>
						<span style={{ flex: 1 }}>
							{p.name}{" "}
							{odds[i] != null && (
								<strong>({(odds[i] * 100).toFixed(1)}%)</strong>
							)}
						</span>
						<span><strong>${totals[p.name] || 0}</strong></span>

						{/* Shield toggle (only if enabled) */}
						{shieldsEnabled && (
							<button
								onClick={() =>
									setPlayers(prev =>
										prev.map((pp, idx) =>
											idx === i && pp.hasShield
												? { ...pp, activeShield: !pp.activeShield }
												: pp
										)
									)
								}
								disabled={!p.hasShield}
								title={
									p.hasShield
										? (p.activeShield ? "Deactivate shield" : "Activate shield")
										: "Shield used"
								}
								style={{
									marginLeft: 8,
									padding: "2px 6px",
									borderRadius: 6,
									border: "none",
									background: p.activeShield ? "#ca0acaff" : "#111",
									color: "white",
									cursor: p.hasShield ? "pointer" : "not-allowed",
									opacity: p.hasShield ? 1 : 0.5,
								}}
							>
								🛡️
							</button>
						)}

						<button
							onClick={() => removePlayer(p.name)}
							aria-label={`Remove ${p.name}`}
							style={{
								marginLeft: 8,
								width: 22,
								height: 22,
								borderRadius: 6,
								border: "none",
								background: "#111",
								color: "white",
								cursor: "pointer",
								lineHeight: "22px",
								fontWeight: 900,
							}}
						>
							×
						</button>
					</div>
				))}
				<br />
				<br />
				{/* Add player */}
				<div style={{ display: "grid", gap: 8, width: 320, marginTop: 8 }}>
					<div style={{ display: "flex", gap: 8 }}>
						<input
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							placeholder="Player name"
							style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
						/>
						<button
							onClick={addPlayer}
							style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#111", color: "white", fontWeight: 700 }}
						>
							Add
						</button>
					</div>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
						{PALETTE.map((c) => (
							<button
								key={c}
								aria-label={`color ${c}`}
								onClick={() => setNewColor(c)}
								style={{
									height: 28, borderRadius: 8, border: newColor === c ? "3px solid #111" : "2px solid #888",
									background: c, cursor: "pointer"
								}}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
