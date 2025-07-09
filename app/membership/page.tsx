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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search, 
  Filter, 
  Download,
  Eye,
  CreditCard,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react'

interface MembershipData {
  id: string
  first_name: string
  last_name: string
  reg_id: string
  county: string
  email: string
  mobile_number: string
  profile_image?: string
  created_at: string
  lastContribution?: string
  totalContributions: number
  contributionCount: number
  status: 'Active' | 'Inactive' | 'Delinquent'
}

export default function Membership() {
  const [members, setMembers] = useState<MembershipData[]>([])
  const [counties, setCounties] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCounty, setSelectedCounty] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch waste pickers
        const { data: wastePickers, error: pickersError } = await supabase
          .from('waste_pickers')
          .select('*')
          .order('created_at', { ascending: false })

        if (pickersError) throw pickersError

        // Fetch contributions for each member
        const { data: contributions, error: contributionsError } = await supabase
          .from('contributions')
          .select('member_id, amount, date')
          .order('date', { ascending: false })

        if (contributionsError) throw contributionsError

        // Fetch counties
        const { data: countiesData, error: countiesError } = await supabase
          .from('counties')
          .select('name')
          .order('name')

        if (countiesError) throw countiesError

        // Process membership data
        const membershipData: MembershipData[] = wastePickers?.map(picker => {
          const memberContributions = contributions?.filter(c => c.member_id === picker.id) || []
          const totalContributions = memberContributions.reduce((sum, c) => sum + Number(c.amount), 0)
          const contributionCount = memberContributions.length
          const lastContribution = memberContributions[0]?.date

          // Determine status based on contribution activity
          let status: 'Active' | 'Inactive' | 'Delinquent' = 'Active'
          if (contributionCount === 0) {
            status = 'Inactive'
          } else if (lastContribution) {
            const daysSinceLastContribution = Math.floor(
              (new Date().getTime() - new Date(lastContribution).getTime()) / (1000 * 60 * 60 * 24)
            )
            if (daysSinceLastContribution > 60) {
              status = 'Delinquent'
            }
          }

          return {
            ...picker,
            lastContribution,
            totalContributions,
            contributionCount,
            status
          }
        }) || []

        setMembers(membershipData)
        setCounties(countiesData?.map(c => c.name) || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter members based on search term, county, and status
  const filteredMembers = members.filter(member => {
    const matchesSearch = searchTerm === '' || 
      member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.reg_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCounty = selectedCounty === '' || member.county === selectedCounty
    const matchesStatus = selectedStatus === '' || member.status === selectedStatus
    
    return matchesSearch && matchesCounty && matchesStatus
  })

  // Calculate summary stats
  const activeMembers = members.filter(m => m.status === 'Active').length
  const inactiveMembers = members.filter(m => m.status === 'Inactive').length
  const delinquentMembers = members.filter(m => m.status === 'Delinquent').length
  const totalContributions = members.reduce((sum, m) => sum + m.totalContributions, 0)

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentMembers = filteredMembers.slice(startIndex, endIndex)

  const handleExport = () => {
    console.log('Export membership data')
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Inactive':
        return 'bg-gray-100 text-gray-800'
      case 'Delinquent':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Inactive':
        return <XCircle className="w-4 h-4 text-gray-600" />
      case 'Delinquent':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
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
            <CreditCard className="w-8 h-8 text-[#003776]" />
            <h1 className="text-3xl font-bold text-gray-900">Membership</h1>
          </div>
          <Badge variant="outline" className="text-[#003776] border-[#003776]">
            {members.length} Total Members
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeMembers}</div>
              <div className="text-xs text-muted-foreground">
                {((activeMembers / members.length) * 100).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-gray-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Members</CardTitle>
              <XCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{inactiveMembers}</div>
              <div className="text-xs text-muted-foreground">
                {((inactiveMembers / members.length) * 100).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delinquent Members</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{delinquentMembers}</div>
              <div className="text-xs text-muted-foreground">
                {((delinquentMembers / members.length) * 100).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#003776]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#003776]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {totalContributions.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                All time contributions
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, ID, or email..."
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
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Delinquent">Delinquent</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => {
                  setSelectedCounty('')
                  setSelectedStatus('')
                }}>
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Members
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
                    <TableHead>Status</TableHead>
                    <TableHead>Contributions</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Last Contribution</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.profile_image} />
                            <AvatarFallback className="bg-[#003776] text-white">
                              {getInitials(member.first_name, member.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.first_name} {member.last_name}</div>
                            <div className="text-sm text-gray-500">{member.reg_id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{member.county}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(member.status)}
                          <Badge className={getStatusColor(member.status)}>
                            {member.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{member.contributionCount}</div>
                          <div className="text-xs text-gray-500">payments</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          KES {member.totalContributions.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.lastContribution ? (
                          <div className="text-sm">
                            {new Date(member.lastContribution).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-500">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredMembers.length)} of {filteredMembers.length} entries
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