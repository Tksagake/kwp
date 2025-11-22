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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

interface County {
  id: string
  name: string
  code: string
}

export default function WastePickers() {
  const [wastePickers, setWastePickers] = useState<WastePicker[]>([])
  const [counties, setCounties] = useState<County[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCounty, setSelectedCounty] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [newWastePicker, setNewWastePicker] = useState<Partial<WastePicker>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<string>('excel')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [selectedCountyCode, setSelectedCountyCode] = useState<string>('')

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
      }
    }

    const fetchData = async () => {
      try {
        const { data: pickersData, error: pickersError } = await supabase
          .from('waste_pickers')
          .select('*')
          .order('created_at', { ascending: false })
        if (pickersError) throw pickersError
        const { data: countiesData, error: countiesError } = await supabase
          .from('counties')
          .select('id, name, code')
          .order('name')
        if (countiesError) throw countiesError
        setWastePickers(pickersData || [])
        setCounties(countiesData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserEmail()
    fetchData()
  }, [])

  const generateRegId = (countyCode: string): string => {
    const uniqueDigits = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000)
    return `WP/${countyCode}/${uniqueDigits}`
  }

  const filteredWastePickers = wastePickers.filter((picker: any) => {
    const matchesSearch = searchTerm === '' ||
      picker.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      picker.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      picker.reg_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      picker.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCounty = selectedCounty === '' || picker.county === selectedCounty
    return matchesSearch && matchesCounty
  })

  const totalPages = Math.ceil(filteredWastePickers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentWastePickers = filteredWastePickers.slice(startIndex, endIndex)

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
      const wastePickers = rows.map((row: string) => {
        const cols = row.split(',')
        if (cols.length < 7) return null
        return {
          first_name: cols[0].trim(),
          last_name: cols[1].trim(),
          reg_id: cols[2].trim(),
          mobile_number: cols[3].trim(),
          email: cols[4].trim(),
          county: cols[5].trim(),
          id_number: cols[6].trim(),
        }
      }).filter(Boolean)
      if (wastePickers.length === 0) {
        showMessage('No valid waste pickers found in the CSV.', 'error')
        setLoading(false)
        return
      }
      const { error } = await supabase.from('waste_pickers').insert(wastePickers)
      if (error) {
        showMessage(`Error inserting waste pickers: ${error.message}`, 'error')
      } else {
        showMessage('Waste pickers imported successfully!', 'success')
        setIsBulkImportModalOpen(false)
        const { data: updatedPickers, error: fetchError } = await supabase
          .from('waste_pickers')
          .select('*')
          .order('created_at', { ascending: false })
        if (!fetchError && updatedPickers) {
          setWastePickers(updatedPickers)
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
    const sampleCsvContent = `First Name,Last Name,Registration ID,Mobile Number,Email,County,ID Number
John,Doe,REG001,1234567890,john.doe@example.com,CountyA,ID123456
Jane,Smith,REG002,0987654321,jane.smith@example.com,CountyB,ID789012`
    const blob = new Blob([sampleCsvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_waste_pickers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = (format: string) => {
    const dataToExport = filteredWastePickers.map(picker => ({
      'First Name': picker.first_name,
      'Last Name': picker.last_name,
      'Registration ID': picker.reg_id,
      'Mobile Number': picker.mobile_number,
      'Email': picker.email,
      'County': picker.county,
      'ID Number': picker.id_number,
      'Joined': new Date(picker.created_at).toLocaleDateString()
    }))

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Waste Pickers')
      XLSX.writeFile(workbook, 'WastePickers.xlsx')
    } else if (format === 'pdf') {
      const doc = new jsPDF()

      // Add logo
      const logoUrl = '/logo.jpg'
      doc.addImage(logoUrl, 'PNG', 15, 10, 30, 15)

      // Add title
      doc.setFontSize(16)
      const countyName = selectedCounty || 'All Counties'
      doc.text(`KeNaWPWA Waste Pickers - ${countyName}`, 15, 35)

      // Add table
      autoTable(doc, {
        head: [['First Name', 'Last Name', 'Registration ID', 'Mobile Number', 'Email', 'County', 'ID Number', 'Joined']],
        body: dataToExport.map(picker => [
          picker['First Name'],
          picker['Last Name'],
          picker['Registration ID'],
          picker['Mobile Number'],
          picker['Email'],
          picker['County'],
          picker['ID Number'],
          picker['Joined']
        ]),
        startY: 45,
      })

      // Add footer
      const currentDate = new Date()
      const dateTimeString = currentDate.toLocaleString()
      const footerText = `Downloaded by: ${userEmail} | On: ${dateTimeString}`
      const pageCount = doc.getNumberOfPages()

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(10)
        doc.text(footerText, 15, doc.internal.pageSize.height - 10)
      }

      doc.save('WastePickers.pdf')
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const handleCreate = async () => {
    try {
      const { data, error } = await supabase
        .from('waste_pickers')
        .insert(newWastePicker)
        .select()
      if (error) throw error
      setWastePickers([...wastePickers, ...data])
      setNewWastePicker({})
      setIsAddModalOpen(false)
    } catch (error) {
      console.error('Error creating waste picker:', error)
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return
    try {
      const { data, error } = await supabase
        .from('waste_pickers')
        .update(newWastePicker)
        .eq('id', editingId)
        .select()
      if (error) throw error
      setWastePickers(wastePickers.map(picker => picker.id === editingId ? data[0] : picker))
      setEditingId(null)
      setNewWastePicker({})
      setIsEditModalOpen(false)
    } catch (error) {
      console.error('Error updating waste picker:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('waste_pickers')
        .delete()
        .eq('id', id)
      if (error) throw error
      setWastePickers(wastePickers.filter(picker => picker.id !== id))
    } catch (error) {
      console.error('Error deleting waste picker:', error)
    }
  }

  const handleEdit = (picker: WastePicker) => {
    setEditingId(picker.id)
    setNewWastePicker(picker)
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
            <Users className="w-8 h-8 text-[#003776]" />
            <h1 className="text-3xl font-bold text-gray-900">Waste Pickers</h1>
          </div>
          <Badge variant="outline" className="text-[#003776] border-[#003776]">
            {wastePickers.length} Total Members
          </Badge>
        </div>
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
                    {counties.map((county: County) => (
                      <SelectItem key={county.id} value={county.name}>
                        {county.name}
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
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#003776] hover:bg-[#4e73df]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Waste Picker</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input placeholder="First Name" value={newWastePicker.first_name || ''} onChange={(e) => setNewWastePicker({...newWastePicker, first_name: e.target.value})} />
                    <Input placeholder="Last Name" value={newWastePicker.last_name || ''} onChange={(e) => setNewWastePicker({...newWastePicker, last_name: e.target.value})} />
                    <Input placeholder="Registration ID" value={newWastePicker.reg_id || ''} disabled className="bg-gray-100 cursor-not-allowed" title="Auto-generated based on county selection" />
                    <Input placeholder="Mobile Number" value={newWastePicker.mobile_number || ''} onChange={(e) => setNewWastePicker({...newWastePicker, mobile_number: e.target.value})} />
                    <Input placeholder="Email" value={newWastePicker.email || ''} onChange={(e) => setNewWastePicker({...newWastePicker, email: e.target.value})} />
                    <Input placeholder="ID Number" value={newWastePicker.id_number || ''} onChange={(e) => setNewWastePicker({...newWastePicker, id_number: e.target.value})} />
                    <Select value={newWastePicker.county || ''} onValueChange={(value) => {
                      const selectedCounty = counties.find((c: County) => c.name === value)
                      if (selectedCounty) {
                        setSelectedCountyCode(selectedCounty.code)
                        const regId = generateRegId(selectedCounty.code)
                        setNewWastePicker({...newWastePicker, county: value, reg_id: regId})
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select County" />
                      </SelectTrigger>
                      <SelectContent>
                        {counties.map((county: County) => (
                          <SelectItem key={county.id} value={county.name}>{county.name}</SelectItem>
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
                    <DialogTitle>Bulk Import Waste Pickers</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="mb-4 text-sm text-gray-600">
                      <p>1. Ensure your CSV file has the following columns:</p>
                      <ul className="list-disc pl-5">
                        <li>First Name</li>
                        <li>Last Name</li>
                        <li>Registration ID</li>
                        <li>Mobile Number</li>
                        <li>Email</li>
                        <li>County</li>
                        <li>ID Number</li>
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
                    <DialogTitle>Export Waste Pickers</DialogTitle>
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
                    <TableHead>Registration ID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>County</TableHead>
                    <TableHead>ID Number</TableHead>
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
                        <div className="flex gap-2">
                          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(picker)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Waste Picker</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <Input placeholder="First Name" value={newWastePicker.first_name || ''} onChange={(e) => setNewWastePicker({...newWastePicker, first_name: e.target.value})} />
                                <Input placeholder="Last Name" value={newWastePicker.last_name || ''} onChange={(e) => setNewWastePicker({...newWastePicker, last_name: e.target.value})} />
                                <Input placeholder="Registration ID" value={newWastePicker.reg_id || ''} disabled className="bg-gray-100 cursor-not-allowed" title="Auto-generated based on county selection" />
                                <Input placeholder="Mobile Number" value={newWastePicker.mobile_number || ''} onChange={(e) => setNewWastePicker({...newWastePicker, mobile_number: e.target.value})} />
                                <Input placeholder="Email" value={newWastePicker.email || ''} onChange={(e) => setNewWastePicker({...newWastePicker, email: e.target.value})} />
                                <Input placeholder="ID Number" value={newWastePicker.id_number || ''} onChange={(e) => setNewWastePicker({...newWastePicker, id_number: e.target.value})} />
                                <Select value={newWastePicker.county || ''} onValueChange={(value) => {
                                  const selectedCounty = counties.find((c: County) => c.name === value)
                                  if (selectedCounty) {
                                    setSelectedCountyCode(selectedCounty.code)
                                    const regId = generateRegId(selectedCounty.code)
                                    setNewWastePicker({...newWastePicker, county: value, reg_id: regId})
                                  }
                                }}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select County" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {counties.map((county: County) => (
                                      <SelectItem key={county.id} value={county.name}>{county.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
                                Are you sure you want to delete <span className="font-semibold">{picker.first_name} {picker.last_name}</span>? This action cannot be undone.
                              </div>
                              <div className="flex gap-2 justify-end">
                                <DialogTrigger asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogTrigger>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDelete(picker.id)}
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
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredWastePickers.length)} of {filteredWastePickers.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Entries per page:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}>
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
