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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Plus, 
  Filter, 
  Download,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react'

interface Contribution {
  id: string
  amount: number
  date: string
  type: 'Monthly' | 'Donation' | 'Other'
  description?: string
  waste_pickers: {
    first_name: string
    last_name: string
    reg_id: string
    county: string
  }
  created_at: string
}

export default function Contributions() {
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [counties, setCounties] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCounty, setSelectedCounty] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch contributions with waste picker details
        const { data: contributionsData, error: contributionsError } = await supabase
          .from('contributions')
          .select(`
            *,
            waste_pickers (
              first_name,
              last_name,
              reg_id,
              county
            )
          `)
          .order('date', { ascending: false })

        if (contributionsError) throw contributionsError

        // Fetch counties
        const { data: countiesData, error: countiesError } = await supabase
          .from('counties')
          .select('name')
          .order('name')

        if (countiesError) throw countiesError

        setContributions(contributionsData || [])
        setCounties(countiesData?.map(c => c.name) || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter contributions based on search term, county, and type
  const filteredContributions = contributions.filter(contribution => {
    const memberName = `${contribution.waste_pickers.first_name} ${contribution.waste_pickers.last_name}`
    const matchesSearch = searchTerm === '' || 
      memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contribution.waste_pickers.reg_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contribution.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCounty = selectedCounty === '' || contribution.waste_pickers.county === selectedCounty
    const matchesType = selectedType === '' || contribution.type === selectedType
    
    return matchesSearch && matchesCounty && matchesType
  })

  // Calculate totals
  const totalAmount = filteredContributions.reduce((sum, c) => sum + Number(c.amount), 0)
  const monthlyTotal = filteredContributions
    .filter(c => c.type === 'Monthly')
    .reduce((sum, c) => sum + Number(c.amount), 0)
  const donationsTotal = filteredContributions
    .filter(c => c.type === 'Donation')
    .reduce((sum, c) => sum + Number(c.amount), 0)

  // Pagination
  const totalPages = Math.ceil(filteredContributions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentContributions = filteredContributions.slice(startIndex, endIndex)

  const handleExport = () => {
    console.log('Export contributions data')
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Monthly':
        return 'bg-blue-100 text-blue-800'
      case 'Donation':
        return 'bg-green-100 text-green-800'
      case 'Other':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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
            <DollarSign className="w-8 h-8 text-[#003776]" />
            <h1 className="text-3xl font-bold text-gray-900">Contributions</h1>
          </div>
          <Badge variant="outline" className="text-[#003776] border-[#003776]">
            {contributions.length} Total Contributions
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-[#003776]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {totalAmount.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                All time total
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Dues</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {monthlyTotal.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                Monthly fees collected
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {donationsTotal.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                Voluntary donations
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Contributions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by member name or registration ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by county" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Counties</SelectItem>
                    {counties.map(county => (
                      <SelectItem key={county} value={county}>{county}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Donation">Donation</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => {
                  setSelectedCounty('')
                  setSelectedType('')
                }}>
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="bg-[#003776] hover:bg-[#4e73df]">
                <Plus className="w-4 h-4 mr-2" />
                Add Contribution
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
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
                    <TableHead>Member</TableHead>
                    <TableHead>County</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentContributions.map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {contribution.waste_pickers.first_name} {contribution.waste_pickers.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contribution.waste_pickers.reg_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{contribution.waste_pickers.county}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          KES {Number(contribution.amount).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(contribution.type)}>
                          {contribution.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(contribution.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate">
                          {contribution.description || '-'}
                        </div>
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
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredContributions.length)} of {filteredContributions.length} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-[#003776] hover:bg-[#4e73df]" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}