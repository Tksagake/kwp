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
  Plus,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  Users
} from 'lucide-react'

interface WastePicker {
  id: string
  first_name: string
  last_name: string
  reg_id: string
  mobile_number: string
  county: string
  email: string
  id_number: string
  profile_image?: string
  created_at: string
}

export default function WastePickers() {
  const [wastePickers, setWastePickers] = useState<WastePicker[]>([])
  const [counties, setCounties] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCounty, setSelectedCounty] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch waste pickers
        const { data: pickersData, error: pickersError } = await supabase
          .from('waste_pickers')
          .select('*')
          .order('created_at', { ascending: false })

        if (pickersError) throw pickersError

        // Fetch counties
        const { data: countiesData, error: countiesError } = await supabase
          .from('counties')
          .select('name')
          .order('name')

        if (countiesError) throw countiesError

        // Filter out any empty strings from the counties data
        const validCounties = countiesData
          ?.map(c => c.name)
          ?.filter(county => county && county.trim() !== '')

        setWastePickers(pickersData || [])
        setCounties(validCounties || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter waste pickers based on search term and county
  const filteredWastePickers = wastePickers.filter(picker => {
    const matchesSearch = searchTerm === '' ||
      picker.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      picker.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      picker.reg_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      picker.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCounty = selectedCounty === '' || picker.county === selectedCounty

    return matchesSearch && matchesCounty
  })

  // Pagination
  const totalPages = Math.ceil(filteredWastePickers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentWastePickers = filteredWastePickers.slice(startIndex, endIndex)

  const handleExport = () => {
    // Export functionality will be implemented
    console.log('Export waste pickers data')
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
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
            <Users className="w-8 h-8 text-[#003776]" />
            <h1 className="text-3xl font-bold text-gray-900">Waste Pickers</h1>
          </div>
          <Badge variant="outline" className="text-[#003776] border-[#003776]">
            {wastePickers.length} Total Members
          </Badge>
        </div>
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Waste Pickers</CardTitle>
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
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setSelectedCounty('')}>
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-[#003776] hover:bg-[#4e73df]">
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
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
                    <TableHead>Registration ID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>County</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentWastePickers.map((picker) => (
                    <TableRow key={picker.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={picker.profile_image} />
                            <AvatarFallback className="bg-[#003776] text-white">
                              {getInitials(picker.first_name, picker.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{picker.first_name} {picker.last_name}</div>
                            <div className="text-sm text-gray-500">{picker.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{picker.reg_id}</Badge>
                      </TableCell>
                      <TableCell>{picker.mobile_number}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{picker.county}</Badge>
                      </TableCell>
                      <TableCell>{picker.id_number}</TableCell>
                      <TableCell>
                        {new Date(picker.created_at).toLocaleDateString()}
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredWastePickers.length)} of {filteredWastePickers.length} entries
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
