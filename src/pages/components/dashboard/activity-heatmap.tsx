import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useUser } from '../../../hooks/useUser';
import { getRatingLevel } from '../../../utils/ratingUtils';

// Mock data - this should come from user's rating history in Firestore
const generateMockData = (currentRating: number) => {
  const data = [];
  const startRating = 200; // Minimum rating (Beginner level)
  let rating = startRating;
  
  // Generate 30 days of data leading up to current rating
  const increment = (currentRating - startRating) / 30;
  
  for (let i = 0; i < 30; i++) {
    rating += increment + (Math.random() * 10 - 5); // Add some variation
    rating = Math.max(200, rating); // Don't go below minimum rating
    
    const date = new Date();
    date.setDate(date.getDate() - (30 - i));
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rating: Math.round(rating),
    });
  }
  
  // Ensure last point is current rating
  data[data.length - 1].rating = currentRating;
  
  return data;
};

export function ActivityHeatmap() {
  const { userData, loading } = useUser();
  const currentRating = userData?.rating || 200;
  const ratingInfo = getRatingLevel(currentRating);
  
  // Generate or use actual rating history data
  const ratingData = generateMockData(currentRating);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full"/>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm">{payload[0].payload.date}</p>
          <p className={`font-bold ${ratingInfo.color}`}>
            Rating: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Rating Progress
          </h3>
          <p className="text-sm text-gray-400 mt-1">Last 30 days</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Current Rating</p>
          <p className={`text-2xl font-bold ${ratingInfo.color}`}>
            {currentRating}
          </p>
          <p className="text-xs text-gray-500">{ratingInfo.level}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={ratingData}>
          <defs>
            <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            domain={[0, 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="rating"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="url(#ratingGradient)"
          />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={{ fill: '#06b6d4', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Rating Milestones */}
      <div className="mt-6 grid grid-cols-4 gap-3 text-center">
        <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <p className="text-xs text-gray-400 mb-1">Beginner</p>
          <p className={`text-sm font-semibold ${currentRating >= 200 ? 'text-green-400' : 'text-gray-500'}`}>
            200-399
          </p>
        </div>
        <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <p className="text-xs text-gray-400 mb-1">Medium</p>
          <p className={`text-sm font-semibold ${currentRating >= 400 ? 'text-blue-400' : 'text-gray-500'}`}>
            400-599
          </p>
        </div>
        <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <p className="text-xs text-gray-400 mb-1">Advanced</p>
          <p className={`text-sm font-semibold ${currentRating >= 600 ? 'text-purple-400' : 'text-gray-500'}`}>
            600-799
          </p>
        </div>
        <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <p className="text-xs text-gray-400 mb-1">Expert</p>
          <p className={`text-sm font-semibold ${currentRating >= 800 ? 'text-orange-400' : 'text-gray-500'}`}>
            800+
          </p>
        </div>
      </div>
    </div>
  );
}
