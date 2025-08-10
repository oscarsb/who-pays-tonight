import TotalsOverTime from "./TotalsOverTime";
import type { HistoryItem } from "../App";

type Props = {
	history: HistoryItem[];
	players: { name: string; color: string }[];   // <— add this
	shieldsEnabled: boolean;
	onToggleShields: () => void;
	onReset: () => void;
	onResetShields: () => void;
	onDeleteLast: () => void;
};

export default function HistorySettings(props: Props) {
	const { history, players, shieldsEnabled, onToggleShields, onReset, onResetShields, onDeleteLast } = props;

	return (
		<>
			<div style={{ width: 320 }}>
				<h3>History</h3>
				{history.length === 0 && <div>No spins yet</div>}
				{history.map((h, i) => (
					<div
						key={i}
						style={{
							display: "flex",
							justifyContent: "space-between",
							padding: "4px 6px",
							background: "#000000ff",
							borderRadius: 4,
							marginBottom: 4,
							fontSize: 14,
						}}
					>
						<span>{h.time}</span>
						<span>
							{h.name} - ${h.amount}
							{h.shieldUsedBy && h.shieldUsedBy.length > 0 && (
								<span style={{ marginLeft: 6, color: "#f1c40f" }}>
									🛡 {h.shieldUsedBy.length}
								</span>
							)}
						</span>
					</div>
				))}

				<h3 style={{ marginTop: 16 }}>Settings</h3>
				<label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
					<input type="checkbox" checked={shieldsEnabled} onChange={onToggleShields} />
					Enable one-time shields
				</label>

				<button
					onClick={onReset}
					style={{
						padding: "8px 12px",
						borderRadius: 8,
						border: "none",
						background: "#c0392b",
						color: "white",
						fontWeight: 700,
						cursor: "pointer"
					}}
				>
					Reset
				</button>
				<br />
				<br />
				<button
					onClick={onResetShields}
					style={{
						padding: "8px 12px",
						borderRadius: 8,
						border: "none",
						background: "#2b5fc0ff",
						color: "white",
						fontWeight: 700,
						cursor: "pointer"
					}}
				>
					Reset shields
				</button>
				<br />
				<br />
				<button
					onClick={onDeleteLast}
					disabled={history.length === 0}
					style={{
						padding: "8px 12px",
						borderRadius: 8,
						border: "none",
						background: history.length === 0 ? "#888" : "#e67e22",
						color: "white",
						fontWeight: 700,
						cursor: history.length === 0 ? "not-allowed" : "pointer"
					}}
				>
					Delete last entry
				</button>
				<br />
				<br />

			</div>
			<div style={{ width: 320 }}>
				<TotalsOverTime history={history} players={players} />
			</div>
		</>
	)
}
