'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Bell, 
  Send, 
  Plus, 
  Users, 
  UserCheck, 
  MessageCircle,
  Clock,
  CheckCircle,
  Eye
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  recipient_type: string
  recipient_id?: string
  sent_at: string
  created_at: string
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [wastePickers, setWastePickers] = useState<any[]>([])
  const [countyManagers, setCountyManagers] = useState<any[]>([])
  const [counties, setCounties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isComposing, setIsComposing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipient_type: '',
    recipient_id: '',
    selectedCounties: [] as string[]
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch notifications
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .order('sent_at', { ascending: false })

        if (notificationsError) throw notificationsError

        // Fetch waste pickers
        const { data: pickersData, error: pickersError } = await supabase
          .from('waste_pickers')
          .select('id, first_name, last_name, reg_id')
          .order('first_name')

        if (pickersError) throw pickersError

        // Fetch county managers
        const { data: managersData, error: managersError } = await supabase
          .from('county_managers')
          .select('id, first_name, last_name, username')
          .order('first_name')

        if (managersError) throw managersError

        // Fetch counties
        const { data: countiesData, error: countiesError } = await supabase
          .from('counties')
          .select('id, name, code')
          .order('name')

        if (countiesError) throw countiesError

        setNotifications(notificationsData || [])
        setWastePickers(pickersData || [])
        setCountyManagers(managersData || [])
        setCounties(countiesData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let notificationsToInsert: any[] = []

      // Check if bulk counties are selected
      if (formData.recipient_type === 'select_counties') {
        // Create a notification for each selected county
        notificationsToInsert = formData.selectedCounties.map((countyId: string) => {
          const county = counties.find((c: any) => c.id === countyId)
          return {
            title: formData.title,
            message: formData.message,
            recipient_type: county?.name || `county:${countyId}`,
            recipient_id: null,
            sent_at: new Date().toISOString()
          }
        })
      } else if (formData.recipient_type === 'all_counties') {
        // Create a notification for all counties
        notificationsToInsert = counties.map((county: any) => ({
          title: formData.title,
          message: formData.message,
          recipient_type: county.name,
          recipient_id: null,
          sent_at: new Date().toISOString()
        }))
      } else {
        // Single notification
        notificationsToInsert = [{
          title: formData.title,
          message: formData.message,
          recipient_type: formData.recipient_type,
          recipient_id: formData.recipient_id || null,
          sent_at: new Date().toISOString()
        }]
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationsToInsert)

      if (error) throw error

      // Refresh notifications
      const { data: updatedNotifications } = await supabase
        .from('notifications')
        .select('*')
        .order('sent_at', { ascending: false })

      setNotifications(updatedNotifications || [])
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        recipient_type: '',
        recipient_id: '',
        selectedCounties: []
      })
      setIsComposing(false)
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  const getRecipientText = (notification: Notification) => {
    // Check if recipient_type is a county name directly
    const isCountyName = counties.some((c: any) => c.name === notification.recipient_type)
    if (isCountyName) {
      return notification.recipient_type
    }

    switch (notification.recipient_type) {
      case 'all_waste_pickers':
        return 'All Waste Pickers'
      case 'all_managers':
        return 'All County Managers'
      case 'waste_picker':
        const picker = wastePickers.find((p: any) => p.id === notification.recipient_id)
        return picker ? `Waste Picker: ${picker.first_name} ${picker.last_name}` : 'Unknown Picker'
      case 'county_manager':
        const manager = countyManagers.find((m: any) => m.id === notification.recipient_id)
        return manager ? `County Manager: ${manager.first_name} ${manager.last_name}` : 'Unknown Manager'
      default:
        return 'Unknown'
    }
  }

  const getRecipientTypeColor = (type: string) => {
    // Check if type is a county name
    const isCountyName = counties.some((c: any) => c.name === type)
    if (isCountyName) {
      return 'bg-red-100 text-red-800'
    }

    switch (type) {
      case 'all_waste_pickers':
        return 'bg-blue-100 text-blue-800'
      case 'all_managers':
        return 'bg-green-100 text-green-800'
      case 'waste_picker':
        return 'bg-purple-100 text-purple-800'
      case 'county_manager':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Pagination
  const totalPages = Math.ceil(notifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentNotifications = notifications.slice(startIndex, endIndex)

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
            <Bell className="w-8 h-8 text-[#003776]" />
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          </div>
          <Badge variant="outline" className="text-[#003776] border-[#003776]">
            {notifications.length} Messages Sent
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-[#003776]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <div className="text-xs text-muted-foreground">
                All time notifications
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waste Picker Messages</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notifications.filter(n => n.recipient_type === 'waste_picker' || n.recipient_type === 'all_waste_pickers').length}
              </div>
              <div className="text-xs text-muted-foreground">
                Messages to waste pickers
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manager Messages</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notifications.filter(n => n.recipient_type === 'county_manager' || n.recipient_type === 'all_managers').length}
              </div>
              <div className="text-xs text-muted-foreground">
                Messages to county managers
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compose Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Notification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isComposing} onOpenChange={setIsComposing}>
              <DialogTrigger asChild>
                <Button className="bg-[#003776] hover:bg-[#4e73df]">
                  <Plus className="w-4 h-4 mr-2" />
                  Compose Message
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Compose New Notification</DialogTitle>
                  <DialogDescription>
                    Send a notification to waste pickers or county managers
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSendNotification} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Enter notification title"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recipient_type">Recipient Type</Label>
                    <Select 
                      value={formData.recipient_type} 
                      onValueChange={(value) => setFormData({...formData, recipient_type: value, recipient_id: '', selectedCounties: []})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_waste_pickers">All Waste Pickers</SelectItem>
                        <SelectItem value="all_managers">All County Managers</SelectItem>
                        <SelectItem value="waste_picker">Individual Waste Picker</SelectItem>
                        <SelectItem value="county_manager">Individual County Manager</SelectItem>
                        <SelectItem value="all_counties">All Counties (47)</SelectItem>
                        <SelectItem value="select_counties">Select Specific Counties</SelectItem>
                        {counties.map((county: any) => (
                          <SelectItem key={county.id} value={`county:${county.id}`}>
                            {county.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.recipient_type === 'waste_picker' && (
                    <div className="space-y-2">
                      <Label htmlFor="recipient_id">Select Waste Picker</Label>
                      <Select 
                        value={formData.recipient_id} 
                        onValueChange={(value) => setFormData({...formData, recipient_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select waste picker" />
                        </SelectTrigger>
                        <SelectContent>
                          {wastePickers.map(picker => (
                            <SelectItem key={picker.id} value={picker.id}>
                              {picker.first_name} {picker.last_name} ({picker.reg_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.recipient_type === 'county_manager' && (
                    <div className="space-y-2">
                      <Label htmlFor="recipient_id">Select County Manager</Label>
                      <Select 
                        value={formData.recipient_id} 
                        onValueChange={(value) => setFormData({...formData, recipient_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select county manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {countyManagers.map((manager: any) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.first_name} {manager.last_name} (@{manager.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.recipient_type === 'select_counties' && (
                    <div className="space-y-2">
                      <Label>Select Counties</Label>
                      <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                        {counties.map((county: any) => (
                          <div key={county.id} className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id={`county-${county.id}`}
                              checked={formData.selectedCounties.includes(county.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    selectedCounties: [...formData.selectedCounties, county.id]
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    selectedCounties: formData.selectedCounties.filter((id: string) => id !== county.id)
                                  })
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <label htmlFor={`county-${county.id}`} className="text-sm cursor-pointer">
                              {county.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">
                        Selected: {formData.selectedCounties.length} counties
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Enter your message"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="bg-[#003776] hover:bg-[#4e73df]">
                      <Send className="w-4 h-4 mr-2" />
                      Send Notification
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsComposing(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Notifications History */}
        <Card>
          <CardHeader>
            <CardTitle>Notification History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Date Sent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentNotifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="max-w-xs">
                        <div className="font-medium truncate">{notification.title}</div>
                        <div className="text-sm text-gray-500 break-words line-clamp-2">
                          {notification.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRecipientTypeColor(notification.recipient_type)}>
                          {getRecipientText(notification)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          {new Date(notification.sent_at).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Sent
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, notifications.length)} of {notifications.length} entries
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