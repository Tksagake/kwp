'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Search, 
  Plus, 
  Edit,
  Trash2,
  Eye,
  MapPin,
  Users,
  UserCheck
} from 'lucide-react'

interface County {
  id: string
  name: string
  code: string
  created_at: string
}

interface CountyStats {
  [key: string]: {
    wastePickers: number
    managers: number
  }
}

export default function Counties() {
  const [counties, setCounties] = useState<County[]>([])
  const [countyStats, setCountyStats] = useState<CountyStats>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch counties
        const { data: countiesData, error: countiesError } = await supabase
          .from('counties')
          .select('*')
          .order('name')

        if (countiesError) throw countiesError

        // Fetch waste pickers count by county
        const { data: wastePickers, error: pickersError } = await supabase
          .from('waste_pickers')
          .select('county')

        if (pickersError) throw pickersError

        // Fetch managers count by county
        const { data: managers, error: managersError } = await supabase
          .from('county_managers')
          .select('county')

        if (managersError) throw managersError

        // Calculate stats
        const stats: CountyStats = {}
        
        // Count waste pickers by county
        wastePickers?.forEach(picker => {
          if (!stats[picker.county]) {
            stats[picker.county] = { wastePickers: 0, managers: 0 }
          }
          stats[picker.county].wastePickers++
        })

        // Count managers by county
        managers?.forEach(manager => {
          if (!stats[manager.county]) {
            stats[manager.county] = { wastePickers: 0, managers: 0 }
          }
          stats[manager.county].managers++
        })

        setCounties(countiesData || [])
        setCountyStats(stats)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter counties based on search term
  const filteredCounties = counties.filter(county => {
    const matchesSearch = searchTerm === '' || 
      county.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      county.code.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003776]"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-8 h-8 text-[#003776]" />
            <h1 className="text-3xl font-bold text-gray-900">Counties</h1>
          </div>
          <Badge variant="outline" className="text-[#003776] border-[#003776]">
            {counties.length} Counties
          </Badge>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Counties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by county name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="bg-[#003776] hover:bg-[#4e73df]">
                <Plus className="w-4 h-4 mr-2" />
                Add County
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>County</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Waste Pickers</TableHead>
                    <TableHead>Managers</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCounties.map((county) => {
                    const stats = countyStats[county.name] || { wastePickers: 0, managers: 0 }
                    
                    return (
                      <TableRow key={county.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#003776] rounded-lg flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">{county.name}</div>
                              <div className="text-sm text-gray-500">County Government</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{county.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{stats.wastePickers}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{stats.managers}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(county.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              stats.managers > 0 
                                ? "text-green-600 border-green-600" 
                                : "text-orange-600 border-orange-600"
                            }
                          >
                            {stats.managers > 0 ? 'Active' : 'No Manager'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}