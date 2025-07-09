'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
  const supabase = createClientComponentClient()
  const [wastePickers, setWastePickers] = useState<WastePicker[]>([])
  const [counties, setCounties] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCounty, setSelectedCounty] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [newWastePicker, setNewWastePicker] = useState<Partial<WastePicker>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [county, setCounty] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: pickersData, error: pickersError } = await supabase
          .from('waste_pickers')
          .select('*')
          .order('created_at', { ascending: false })

        if (pickersError) throw pickersError

        const { data: countiesData, error: countiesError } = await supabase
          .from('counties')
          .select('name')
          .order('name')

        if (countiesError) throw countiesError

        const validCounties = countiesData
          ?.map((c: { name: any }) => c.name)
          ?.filter((county: string) => county && county.trim() !== '')

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

  const filteredWastePickers = wastePickers.filter(picker => {
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

  const handleExport = () => {
    console.log('Export waste pickers data')
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

  const handleUpdate = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('waste_pickers')
        .update(newWastePicker)
        .eq('id', id)
        .select()

      if (error) throw error

      setWastePickers(wastePickers.map(picker => picker.id === id ? data[0] : picker))
      setEditingId(null)
      setNewWastePicker({})
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
  }

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
    if (!county) {
      showMessage('County field is required.', 'error')
      return
    }
    setLoading(true)
    setMessage('')
    const reader = new FileReader()
    reader.readAsText(csvFile)
    reader.onload = async (e) => {
      const text = e.target?.result as string
      if (!text) return
      const rows = text.split('\n').slice(1) // Skip header row
      const wastePickers = rows
        .map((row: string) => {
          const cols = row.split(',')
          if (cols.length < 6) return null // Skip invalid rows
          return {
            first_name: cols[0].trim(),
            last_name: cols[1].trim(),
            reg_id: cols[2].trim(),
            mobile_number: cols[3].trim(),
            email: cols[4]?.trim() || null,
            id_number: cols[5]?.trim() || null,
            county: county,
            created_at: new Date().toISOString().split('T')[0],
          }
        })
        .filter(Boolean) // Remove null values

      if (wastePickers.length === 0) {
        showMessage('No valid waste pickers found in the CSV.', 'error')
        setLoading(false)
        return
      }

      // Insert into Supabase
      const { error } = await supabase.from('waste_pickers').insert(wastePickers)
      if (error) {
        showMessage(`Error inserting waste pickers: ${error.message}`, 'error')
      } else {
        showMessage('Waste pickers imported successfully!', 'success')
        setIsBulkImportModalOpen(false)
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
    const sampleCsvContent = `First Name,Last Name,Registration ID,Mobile Number,Email,ID Number
John,Doe,REG001,1234567890,john.doe@example.com,ID123
Jane,Smith,REG002,0987654321,jane.smith@example.com,ID456`
    const blob = new Blob([sampleCsvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_waste_pickers.csv'
    a.click()
    URL.revokeObjectURL(url)
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

        {message && (
          <div className={`p-3 mb-4 rounded-md text-white ${messageType === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {message}
          </div>
        )}

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
                    <Input placeholder="Registration ID" value={newWastePicker.reg_id || ''} onChange={(e) => setNewWastePicker({...newWastePicker, reg_id: e.target.value})} />
                    <Input placeholder="Mobile Number" value={newWastePicker.mobile_number || ''} onChange={(e) => setNewWastePicker({...newWastePicker, mobile_number: e.target.value})} />
                    <Input placeholder="Email" value={newWastePicker.email || ''} onChange={(e) => setNewWastePicker({...newWastePicker, email: e.target.value})} />
                    <Input placeholder="ID Number" value={newWastePicker.id_number || ''} onChange={(e) => setNewWastePicker({...newWastePicker, id_number: e.target.value})} />
                    <Select value={newWastePicker.county || ''} onValueChange={(value) => setNewWastePicker({...newWastePicker, county: value})}>
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
                        <li>Email (Optional)</li>
                        <li>ID Number (Optional)</li>
                      </ul>
                      <p>2. Fill out the form below to apply to all rows in the CSV.</p>
                      <button
                        onClick={downloadSampleCsv}
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md"
                      >
                        Download Sample CSV
                      </button>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="border p-2 rounded-md w-full mb-4"
                    />
                    <Select value={county} onValueChange={setCounty}>
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
                  <div className="flex justify-end space-x-4">
                    <Button onClick={() => setIsBulkImportModalOpen(false)}>Cancel</Button>
                    <Button onClick={processCsv} disabled={loading}>
                      {loading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export Waste Pickers</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <p>Export functionality will be implemented here.</p>
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
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(picker)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(picker.id)}>
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
