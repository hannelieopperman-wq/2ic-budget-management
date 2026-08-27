import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '../ui';
import { formatCurrency } from '../../utils/currency';

const PALETTE = ['#FF6F61', '#20B7A4', '#F6B84E', '#E2483A', '#22314F', '#48597A'];

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
              <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: '#48597A' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: '#17223A' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v) || 0)}
                contentStyle={{ borderRadius: 12, border: '1px solid #F6EAE0', fontSize: 12 }}
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
