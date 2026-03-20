import React from 'react';
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  CreditCard, 
  ArrowUpRight, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Activity,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'motion/react';

const data = [
  { name: 'Mon', usage: 12 },
  { name: 'Tue', usage: 19 },
  { name: 'Wed', usage: 15 },
  { name: 'Thu', usage: 22 },
  { name: 'Fri', usage: 30 },
  { name: 'Sat', usage: 25 },
  { name: 'Sun', usage: 18 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
            <Activity className="h-4 w-4" />
            System Online
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors">
            <Zap className="h-4 w-4" />
            Upgrade Pro
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Generations', value: '1,284', icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Remaining Credits', value: '450', icon: CreditCard, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
          { label: 'Active API Keys', value: '2', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Avg. Response Time', value: '1.2s', icon: Clock, color: 'text-violet-400', bg: 'bg-violet-400/10' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm hover:border-white/10 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <button className="text-zinc-600 hover:text-white transition-colors">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                <span className="text-xs font-medium text-emerald-500 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" /> +12%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Usage Chart */}
        <div className="lg:col-span-2 p-8 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Usage Analytics</h3>
              <p className="text-sm text-zinc-500">Daily generation activity across all tools.</p>
            </div>
            <select className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-sm text-zinc-400 focus:outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#52525b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #ffffff10',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="usage" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorUsage)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions / Recent */}
        <div className="space-y-6">
          <div className="p-8 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-6">Quick Tools</h3>
            <div className="space-y-4">
              {[
                { label: 'Image Generator', icon: ImageIcon, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                { label: 'Video Generator', icon: Video, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
                { label: 'Prompt Enhancer', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-400/10' },
              ].map((tool, i) => (
                <button 
                  key={i}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${tool.bg} ${tool.color}`}>
                      <tool.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-white">{tool.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Credits Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-cyan-600 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
              <Zap className="h-24 w-24 text-white" />
            </div>
            <div className="relative z-10 space-y-4">
              <h4 className="text-white/80 text-sm font-bold uppercase tracking-wider">Current Plan</h4>
              <h3 className="text-3xl font-bold text-white">Pro Plan</h3>
              <p className="text-white/70 text-sm">You have 450 credits left for this month.</p>
              <button className="w-full py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-100 transition-colors">
                Add Credits
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
