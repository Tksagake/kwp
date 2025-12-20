'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Users, UserCheck, MapPin, DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface Contribution {
  amount: number;
  waste_pickers: {
    county: string;
  }[];
}

interface DashboardStats {
  totalWastePickers: number;
  totalCounties: number;
  totalManagers: number;
  totalContributions: number;
  monthlyTrend: Array<{ month: string; registrations: number }>;
  monthlyContributions: Array<{ month: string; amount: number }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total waste pickers from Kisumu only
        const { count: wastePickers } = await supabase
          .from('waste_pickers')
          .select('*', { count: 'exact', head: true })
          .eq('county', 'Kisumu');

        // Fetch total counties
        const { count: counties } = await supabase
          .from('counties')
          .select('*', { count: 'exact', head: true });

        // Fetch total managers
        const { count: managers } = await supabase
          .from('county_managers')
          .select('*', { count: 'exact', head: true });

        // Fetch total contributions from Kisumu only
        const { data: contributions } = await supabase
          .from('contributions')
          .select(`
            amount,
            waste_pickers!inner(county)
          `)
          .eq('waste_pickers.county', 'Kisumu');

        const totalContributions = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

        // Fetch monthly registration trend (mock data for now)
        const monthlyTrend = [
          { month: 'Jan', registrations: 25 },
          { month: 'Feb', registrations: 32 },
          { month: 'Mar', registrations: 48 },
          { month: 'Apr', registrations: 61 },
          { month: 'May', registrations: 55 },
          { month: 'Jun', registrations: 47 },
        ];

        // Fetch contributions by Kisumu only
        const { data: contributionsByCounty } = await supabase
          .from('contributions')
          .select(`
            amount,
            waste_pickers!inner(county)
          `)
          .eq('waste_pickers.county', 'Kisumu');

        // Calculate monthly contributions for the last 6 months
        const monthlyContributions: Record<string, number> = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        
        if (contributions && contributions.length > 0) {
          contributions.forEach((c: any) => {
            const date = new Date(c.created_at);
            const monthIndex = date.getMonth();
            const monthName = monthNames[monthIndex] || monthNames[monthIndex % 12];
            if (!monthlyContributions[monthName]) {
              monthlyContributions[monthName] = 0;
            }
            monthlyContributions[monthName] += Number(c.amount);
          });
        }
        
        const monthlyContributionsArray = monthNames.map(month => ({
          month,
          amount: monthlyContributions[month] || 0
        }));

        setStats({
          totalWastePickers: wastePickers || 0,
          totalCounties: counties || 0,
          totalManagers: managers || 0,
          totalContributions,
          monthlyTrend,
          monthlyContributions: monthlyContributionsArray,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Activity className="w-3 h-3 mr-1" />
            System Active
          </Badge>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card colorScheme="primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Waste Pickers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalWastePickers}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +12% from last month
              </div>
            </CardContent>
          </Card>
          <Card colorScheme="secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalManagers}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +2 new this month
              </div>
            </CardContent>
          </Card>
          <Card colorScheme="warning">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Counties</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCounties}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Activity className="h-3 w-3 mr-1 text-blue-500" />
                All counties active
              </div>
            </CardContent>
          </Card>
          <Card colorScheme="danger">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {stats?.totalContributions.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +8% from last month
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Registration Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Contributions (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.monthlyContributions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`KES ${Number(value).toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New waste picker registered</p>
                  <p className="text-xs text-gray-500">joined from Nairobi County</p>
                </div>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Monthly contribution received</p>
                  <p className="text-xs text-gray-500">KES 1,600 total recorded</p>
                </div>
                <span className="text-xs text-gray-500">4 hours ago</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">County manager updated</p>
                  <p className="text-xs text-gray-500">updated profile information</p>
                </div>
                <span className="text-xs text-gray-500">6 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
