import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, LabelList } from "recharts";
import type { HistoryItem } from "../App";

type Props = {
	history: HistoryItem[];
	players: { name: string; color: string }[];
};

export default function TotalsOverTime({ history, players }: Props) {
	// build cumulative totals for each spin
	const data = (() => {
		const running: Record<string, number> = {}
		players.forEach(p => (running[p.name] = 0))

		const rows: any[] = []
		const ordered = history.slice().reverse() // oldest → newest

		// optional baseline at spin 0
		rows.push({
			spin: 0,
			...Object.fromEntries(players.map(p => [p.name, 0])),
		})

		ordered.forEach((h, i) => {
			running[h.name] = (running[h.name] || 0) + h.amount
			const point: any = { spin: i + 1 }
			players.forEach(p => (point[p.name] = running[p.name] || 0))
			rows.push(point)
		})

		return rows
	})()

	return (
		<ResponsiveContainer width="100%" height={400}>
			<LineChart data={data}>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis dataKey="spin" label={{ value: "Spin #", position: "insideBottomRight", offset: -5 }} />
				<YAxis label={{ value: "Total ($)", angle: -90, position: "insideLeft" }} />
				<Tooltip />
				<Legend />
				{players.map((p) => (
					<Line
						key={p.name}
						type="monotone"
						dataKey={p.name}
						stroke={p.color}
						strokeWidth={2}
						dot={false}
						isAnimationActive={false}
					>
						<LabelList
							dataKey={p.name}
							content={(props: any) => {
								const { index, x, y, value } = props
								if (index !== data.length - 1) return null        // only last point
								if (value == null || value === 0) return null      // skip 0s
								return (
									<text
										x={x + 6}
										y={y}
										dy={-4}
										fontSize={12}
										fontWeight={700}
										fill={p.color}
										textAnchor="start"
									>
										{`${p.name} (${value})`}
									</text>
								)
							}}
						/>
					</Line>
				))}
			</LineChart>
		</ResponsiveContainer>
	);
}