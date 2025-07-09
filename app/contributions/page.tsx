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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Contribution {
  id: string
  member_id: string
  amount: number
  date: string
  type: 'Monthly' | 'Donation' | 'Other'
  description?: string
  waste_pickers: {
    id: string
    first_name: string
    last_name: string
    reg_id: string
    county: string
  }
  created_at: string
}

export default function Contributions() {
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [wastePickers, setWastePickers] = useState<{ id: string; first_name: string; last_name: string; reg_id: string; county: string }[]>([])
  const [counties, setCounties] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCounty, setSelectedCounty] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [newContribution, setNewContribution] = useState<Partial<Contribution>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<string>('excel')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: contributionsData, error: contributionsError } = await supabase
          .from('contributions')
          .select(`
            *,
            waste_pickers (
              id,
              first_name,
              last_name,
              reg_id,
              county
            )
          `)
          .order('date', { ascending: false })
        if (contributionsError) throw contributionsError

        const { data: wastePickersData, error: wastePickersError } = await supabase
          .from('waste_pickers')
          .select('id, first_name, last_name, reg_id, county')
        if (wastePickersError) throw wastePickersError

        const { data: countiesData, error: countiesError } = await supabase
          .from('counties')
          .select('name')
          .order('name')
        if (countiesError) throw countiesError

        setContributions(contributionsData || [])
        setWastePickers(wastePickersData || [])
        setCounties(countiesData?.map(c => c.name) || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredContributions = contributions.filter(contribution => {
    const memberName = `${contribution.waste_pickers?.first_name || ''} ${contribution.waste_pickers?.last_name || ''}`
    const matchesSearch = searchTerm === '' ||
      memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contribution.waste_pickers?.reg_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contribution.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCounty = selectedCounty === '' || contribution.waste_pickers?.county === selectedCounty
    const matchesType = selectedType === '' || contribution.type === selectedType

    return matchesSearch && matchesCounty && matchesType
  })

  const totalAmount = filteredContributions.reduce((sum, c) => sum + Number(c.amount), 0)
  const monthlyTotal = filteredContributions
    .filter(c => c.type === 'Monthly')
    .reduce((sum, c) => sum + Number(c.amount), 0)
  const donationsTotal = filteredContributions
    .filter(c => c.type === 'Donation')
    .reduce((sum, c) => sum + Number(c.amount), 0)

  const totalPages = Math.ceil(filteredContributions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentContributions = filteredContributions.slice(startIndex, endIndex)

  const handleExport = (format: string) => {
    const dataToExport = filteredContributions.map(contribution => ({
      'Member': `${contribution.waste_pickers.first_name} ${contribution.waste_pickers.last_name}`,
      'County': contribution.waste_pickers.county,
      'Amount': contribution.amount,
      'Type': contribution.type,
      'Date': new Date(contribution.date).toLocaleDateString(),
      'Description': contribution.description || '-'
    }))

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contributions')
      XLSX.writeFile(workbook, 'Contributions.xlsx')
    } else if (format === 'pdf') {
      const doc = new jsPDF()
      autoTable(doc, {
        head: [['Member', 'County', 'Amount', 'Type', 'Date', 'Description']],
        body: dataToExport.map(contribution => [
          contribution['Member'],
          contribution['County'],
          contribution['Amount'],
          contribution['Type'],
          contribution['Date'],
          contribution['Description']
        ])
      })
      doc.save('Contributions.pdf')
    }
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

  const handleCreate = async () => {
    try {
      const { data, error } = await supabase
        .from('contributions')
        .insert(newContribution)
        .select()
      if (error) throw error
      setContributions([...contributions, ...data])
      setNewContribution({})
      setIsAddModalOpen(false)
    } catch (error) {
      console.error('Error creating contribution:', error)
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    try {
      const { data, error } = await supabase
        .from('contributions')
        .update(newContribution)
        .eq('id', editingId)
        .select()
      if (error) throw error
      setContributions(contributions.map(contribution => contribution.id === editingId ? data[0] : contribution))
      setEditingId(null)
      setNewContribution({})
      setIsEditModalOpen(false)
    } catch (error) {
      console.error('Error updating contribution:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contributions')
        .delete()
        .eq('id', id)
      if (error) throw error
      setContributions(contributions.filter(contribution => contribution.id !== id))
    } catch (error) {
      console.error('Error deleting contribution:', error)
    }
  }

  const handleEdit = (contribution: Contribution) => {
    setEditingId(contribution.id)
    setNewContribution(contribution)
    setIsEditModalOpen(true)
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
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#003776] hover:bg-[#4e73df]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contribution
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Contribution</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Select value={newContribution.member_id || ''} onValueChange={(value) => setNewContribution({...newContribution, member_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Member" />
                      </SelectTrigger>
                      <SelectContent>
                        {wastePickers.map(picker => (
                          <SelectItem key={picker.id} value={picker.id}>
                            {picker.first_name} {picker.last_name} ({picker.reg_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Amount" value={newContribution.amount || ''} onChange={(e) => setNewContribution({...newContribution, amount: Number(e.target.value)})} />
                    <Input type="date" placeholder="Date" value={newContribution.date || ''} onChange={(e) => setNewContribution({...newContribution, date: e.target.value})} />
                    <Select value={newContribution.type || ''} onValueChange={(value) => setNewContribution({...newContribution, type: value as 'Monthly' | 'Donation' | 'Other'})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Donation">Donation</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Description" value={newContribution.description || ''} onChange={(e) => setNewContribution({...newContribution, description: e.target.value})} />
                  </div>
                  <Button onClick={handleCreate}>Save</Button>
                </DialogContent>
              </Dialog>
              <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export Contributions</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Select onValueChange={(value) => setExportFormat(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select export format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => handleExport(exportFormat)}>Export</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
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
                          
                          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(contribution)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Contribution</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <Select value={newContribution.member_id || ''} onValueChange={(value) => setNewContribution({...newContribution, member_id: value})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Member" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {wastePickers.map(picker => (
                                      <SelectItem key={picker.id} value={picker.id}>
                                        {picker.first_name} {picker.last_name} ({picker.reg_id})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input type="number" placeholder="Amount" value={newContribution.amount || ''} onChange={(e) => setNewContribution({...newContribution, amount: Number(e.target.value)})} />
                                <Input type="date" placeholder="Date" value={newContribution.date || ''} onChange={(e) => setNewContribution({...newContribution, date: e.target.value})} />
                                <Select value={newContribution.type || ''} onValueChange={(value) => setNewContribution({...newContribution, type: value as 'Monthly' | 'Donation' | 'Other'})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Monthly">Monthly</SelectItem>
                                    <SelectItem value="Donation">Donation</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input placeholder="Description" value={newContribution.description || ''} onChange={(e) => setNewContribution({...newContribution, description: e.target.value})} />
                              </div>
                              <Button onClick={handleUpdate}>Save Changes</Button>
                            </DialogContent>
                          </Dialog>
                         <Dialog>
                            <DialogTrigger asChild>
                              <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              >
                              <Trash2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                              <DialogTitle>Confirm Delete</DialogTitle>
                              </DialogHeader>
                              <div className="py-4">
                              Are you sure you want to delete <span className="font-semibold">{ contribution.waste_pickers.first_name} { contribution.waste_pickers.last_name} Contribution? </span>? This action cannot be undone.
                              </div>
                              <div className="flex gap-2 justify-end">
                              <DialogTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogTrigger>
                              <DialogTrigger asChild>
                                <Button
                                variant="destructive"
                                onClick={() => handleDelete(contribution.id)}
                                >
                                Delete
                                </Button>
                              </DialogTrigger>
                              </div>
                            </DialogContent>
                            </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
