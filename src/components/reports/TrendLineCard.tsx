import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card } from '../ui';
import { formatCurrency } from '../../utils/currency';

const PALETTE = ['#D98CA0', '#A8C6A1', '#D9BE86', '#E38B7B', '#5B3A4B', '#7A5266'];

export function TrendLineCard({
  title,
  data,
  seriesKeys,
  yFormat,
}: {
  title: string;
  data: Record<string, string | number>[];
  seriesKeys: string[];
  /** 'currency' formats the axis/tooltip as Rand; 'percent' as a plain %. */
  yFormat: 'currency' | 'percent';
}) {
  const fmt = (v: number) => (yFormat === 'currency' ? formatCurrency(v) : `${v}%`);

  return (
    <Card className="p-6 animate-slide-up">
      <h3 className="mb-4 font-serif text-lg text-plum-ink">{title}</h3>
      {data.length === 0 || seriesKeys.length === 0 ? (
        <p className="py-8 text-center text-sm text-plum-soft">Not enough cycles to show a trend yet.</p>
      ) : (
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F7E3E6" vertical={false} />
              <XAxis dataKey="cycleLabel" tick={{ fontSize: 11, fill: '#7A5266' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#7A5266' }} axisLine={false} tickLine={false} width={yFormat === 'currency' ? 64 : 40} />
              <Tooltip formatter={(v) => fmt(Number(v) || 0)} contentStyle={{ borderRadius: 12, border: '1px solid #F7E3E6', fontSize: 12 }} />
              {seriesKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
              {seriesKeys.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
