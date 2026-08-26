import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '../ui';
import { formatCurrency } from '../../utils/currency';

const PALETTE = ['#D98CA0', '#A8C6A1', '#D9BE86', '#E38B7B', '#5B3A4B', '#7A5266'];

export function BarBreakdownCard({
  title,
  data,
  color,
}: {
  title: string;
  data: { name: string; value: number; color?: string }[];
  color?: string;
}) {
  return (
    <Card className="p-6 animate-slide-up">
      <h3 className="mb-4 font-serif text-lg text-plum-ink">{title}</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-plum-soft">No spending to show yet.</p>
      ) : (
        <div style={{ width: '100%', height: Math.max(180, data.length * 44) }}>
          <ResponsiveContainer>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
              <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: '#7A5266' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: '#402736' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v) || 0)}
                contentStyle={{ borderRadius: 12, border: '1px solid #F7E3E6', fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={22}>
                {data.map((d, i) => (
                  <Cell key={d.name} fill={d.color ?? color ?? PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
