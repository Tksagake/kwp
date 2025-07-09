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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  Send,
  MessageCircle
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CountyManager {
  id: string
  first_name: string
  last_name: string
  username: string
  mobile_number: string
  county: string
  email: string
  created_at: string
}

export default function CountyManagers() {
  const [managers, setManagers] = useState<CountyManager[]>([])
  const [counties, setCounties] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCounty, setSelectedCounty] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [newManager, setNewManager] = useState<Partial<CountyManager>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<string>('excel')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: managersData, error: managersError } = await supabase
          .from('county_managers')
          .select('*')
          .order('created_at', { ascending: false })
        if (managersError) throw managersError

        const { data: countiesData, error: countiesError } = await supabase
          .from('counties')
          .select('name')
          .order('name')
        if (countiesError) throw countiesError

        setManagers(managersData || [])
        setCounties(countiesData?.map(c => c.name) || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredManagers = managers.filter(manager => {
    const matchesSearch = searchTerm === '' ||
      manager.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCounty = selectedCounty === '' || manager.county === selectedCounty

    return matchesSearch && matchesCounty
  })

  const totalPages = Math.ceil(filteredManagers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentManagers = filteredManagers.slice(startIndex, endIndex)

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setCsvFile(event.target.files[0])
    }
  }

  const processCsv = async () => {
    if (!csvFile) {
      showMessage('Please upload a CSV file.', 'error')
      return
    }

    setLoading(true)
    setMessage('')

    const reader = new FileReader()
    reader.readAsText(csvFile)
    reader.onload = async (e) => {
      const text = e.target?.result as string
      if (!text) return

      const rows = text.split('\n').slice(1)
      const managers = rows.map((row: string) => {
        const cols = row.split(',')
        if (cols.length < 6) return null

        return {
          first_name: cols[0].trim(),
          last_name: cols[1].trim(),
          username: cols[2].trim(),
          mobile_number: cols[3].trim(),
          email: cols[4].trim(),
          county: cols[5].trim(),
        }
      }).filter(Boolean)

      if (managers.length === 0) {
        showMessage('No valid managers found in the CSV.', 'error')
        setLoading(false)
        return
      }

      const { error } = await supabase.from('county_managers').insert(managers)
      if (error) {
        showMessage(`Error inserting managers: ${error.message}`, 'error')
      } else {
        showMessage('Managers imported successfully!', 'success')
        setIsBulkImportModalOpen(false)
        const { data: updatedManagers, error: fetchError } = await supabase
          .from('county_managers')
          .select('*')
          .order('created_at', { ascending: false })
        if (!fetchError && updatedManagers) {
          setManagers(updatedManagers)
        }
      }
      setLoading(false)
    }
  }

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 5000)
  }

  const downloadSampleCsv = () => {
    const sampleCsvContent = `First Name,Last Name,Username,Mobile Number,Email,County
John,Doe,johndoe,1234567890,john.doe@example.com,CountyA
Jane,Smith,janesmith,0987654321,jane.smith@example.com,CountyB`
    const blob = new Blob([sampleCsvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_county_managers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = (format: string) => {
    const dataToExport = filteredManagers.map(manager => ({
      'First Name': manager.first_name,
      'Last Name': manager.last_name,
      'Username': manager.username,
      'Mobile Number': manager.mobile_number,
      'Email': manager.email,
      'County': manager.county,
      'Joined': new Date(manager.created_at).toLocaleDateString()
    }))

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'County Managers')
      XLSX.writeFile(workbook, 'CountyManagers.xlsx')
    } else if (format === 'pdf') {
      const doc = new jsPDF()
      autoTable(doc, {
        head: [['First Name', 'Last Name', 'Username', 'Mobile Number', 'Email', 'County', 'Joined']],
        body: dataToExport.map(manager => [
          manager['First Name'],
          manager['Last Name'],
          manager['Username'],
          manager['Mobile Number'],
          manager['Email'],
          manager['County'],
          manager['Joined']
        ])
      })
      doc.save('CountyManagers.pdf')
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const handleCreate = async () => {
    try {
      const { data, error } = await supabase
        .from('county_managers')
        .insert(newManager)
        .select()
      if (error) throw error
      setManagers([...managers, ...data])
      setNewManager({})
      setIsAddModalOpen(false)
    } catch (error) {
      console.error('Error creating manager:', error)
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    try {
      const { data, error } = await supabase
        .from('county_managers')
        .update(newManager)
        .eq('id', editingId)
        .select()
      if (error) throw error
      setManagers(managers.map(manager => manager.id === editingId ? data[0] : manager))
      setEditingId(null)
      setNewManager({})
      setIsEditModalOpen(false)
    } catch (error) {
      console.error('Error updating manager:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('county_managers')
        .delete()
        .eq('id', id)
      if (error) throw error
      setManagers(managers.filter(manager => manager.id !== id))
    } catch (error) {
      console.error('Error deleting manager:', error)
    }
  }

  const handleEdit = (manager: CountyManager) => {
    setEditingId(manager.id)
    setNewManager(manager)
    setIsEditModalOpen(true)
  }

  const handleSendNotification = (managerId: string) => {
    console.log('Send notification to manager:', managerId)
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
            <UserCheck className="w-8 h-8 text-[#003776]" />
            <h1 className="text-3xl font-bold text-gray-900">County Managers</h1>
          </div>
          <Badge variant="outline" className="text-[#003776] border-[#003776]">
            {managers.length} Active Managers
          </Badge>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Manage County Managers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, username, or email..."
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
                <Button variant="outline" onClick={() => setSelectedCounty('')}>
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#003776] hover:bg-[#4e73df]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Manager
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New County Manager</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input placeholder="First Name" value={newManager.first_name || ''} onChange={(e) => setNewManager({...newManager, first_name: e.target.value})} />
                    <Input placeholder="Last Name" value={newManager.last_name || ''} onChange={(e) => setNewManager({...newManager, last_name: e.target.value})} />
                    <Input placeholder="Username" value={newManager.username || ''} onChange={(e) => setNewManager({...newManager, username: e.target.value})} />
                    <Input placeholder="Mobile Number" value={newManager.mobile_number || ''} onChange={(e) => setNewManager({...newManager, mobile_number: e.target.value})} />
                    <Input placeholder="Email" value={newManager.email || ''} onChange={(e) => setNewManager({...newManager, email: e.target.value})} />
                    <Select value={newManager.county || ''} onValueChange={(value) => setNewManager({...newManager, county: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select County" />
                      </SelectTrigger>
                      <SelectContent>
                        {counties.map(county => (
                          <SelectItem key={county} value={county}>{county}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreate}>Save</Button>
                </DialogContent>
              </Dialog>
              <Dialog open={isBulkImportModalOpen} onOpenChange={setIsBulkImportModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Import County Managers</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="mb-4 text-sm text-gray-600">
                      <p>1. Ensure your CSV file has the following columns:</p>
                      <ul className="list-disc pl-5">
                        <li>First Name</li>
                        <li>Last Name</li>
                        <li>Username</li>
                        <li>Mobile Number</li>
                        <li>Email</li>
                        <li>County</li>
                      </ul>
                      <p>2. Download the sample CSV template to see the correct format.</p>
                      <Button onClick={downloadSampleCsv} variant="outline">
                        Download Sample CSV Template
                      </Button>
                    </div>
                    <input type="file" accept=".csv" onChange={handleCsvUpload} className="border p-2 rounded-md w-full mb-4" />
                    <Button onClick={processCsv} disabled={loading}>
                      {loading ? 'Uploading...' : 'Upload'}
                    </Button>
                    {message && (
                      <div className={`p-3 rounded-md text-white ${messageType === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                        {message}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export County Managers</DialogTitle>
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
                    <TableHead>Manager</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>County</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentManagers.map((manager) => (
                    <TableRow key={manager.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-[#4e73df] text-white">
                              {getInitials(manager.first_name, manager.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{manager.first_name} {manager.last_name}</div>
                            <div className="text-sm text-gray-500">{manager.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">@{manager.username}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{manager.county}</Badge>
                      </TableCell>
                      <TableCell>{manager.mobile_number}</TableCell>
                      <TableCell>
                        {new Date(manager.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          
                          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(manager)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit County Manager</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <Input placeholder="First Name" value={newManager.first_name || ''} onChange={(e) => setNewManager({...newManager, first_name: e.target.value})} />
                                <Input placeholder="Last Name" value={newManager.last_name || ''} onChange={(e) => setNewManager({...newManager, last_name: e.target.value})} />
                                <Input placeholder="Username" value={newManager.username || ''} onChange={(e) => setNewManager({...newManager, username: e.target.value})} />
                                <Input placeholder="Mobile Number" value={newManager.mobile_number || ''} onChange={(e) => setNewManager({...newManager, mobile_number: e.target.value})} />
                                <Input placeholder="Email" value={newManager.email || ''} onChange={(e) => setNewManager({...newManager, email: e.target.value})} />
                                <Select value={newManager.county || ''} onValueChange={(value) => setNewManager({...newManager, county: value})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select County" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {counties.map(county => (
                                      <SelectItem key={county} value={county}>{county}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button onClick={handleUpdate}>Save Changes</Button>
                            </DialogContent>
                          </Dialog>
                         
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(manager.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredManagers.length)} of {filteredManagers.length} entries
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
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? 'bg-[#003776] hover:bg-[#4e73df]' : ''}
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
