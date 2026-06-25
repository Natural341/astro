"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Send, Users, Star, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type Notification = {
  id: string
  title: string
  audience: string
  sentAt: string
  status: "sent" | "scheduled" | "draft"
  openRate: number
}

const notificationsData: Notification[] = [
  {
    id: "N-001",
    title: "Weekend Special: 20% off all readings!",
    audience: "All Users",
    sentAt: "2023-10-25 10:00 AM",
    status: "sent",
    openRate: 45.2,
  },
  {
    id: "N-002",
    title: "Your daily horoscope is ready 🌟",
    audience: "Active Users",
    sentAt: "2023-10-26 08:00 AM",
    status: "sent",
    openRate: 62.1,
  },
  {
    id: "N-003",
    title: "New Astrologer joined: Madame Zara",
    audience: "Premium Users",
    sentAt: "2023-10-27 14:00 PM",
    status: "scheduled",
    openRate: 0,
  },
  {
    id: "N-004",
    title: "Draft: Halloween Spooky Readings",
    audience: "All Users",
    sentAt: "-",
    status: "draft",
    openRate: 0,
  },
]

const notificationColumns: ColumnDef<Notification>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => <div className="font-medium max-w-[300px] truncate">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "audience",
    header: "Audience",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("audience")}</Badge>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={
            status === "sent"
              ? "default"
              : status === "scheduled"
              ? "secondary"
              : "outline"
          }
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "sentAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sent At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "openRate",
    header: () => <div className="text-right">Open Rate</div>,
    cell: ({ row }) => {
      const rate = parseFloat(row.getValue("openRate"))
      if (rate === 0) return <div className="text-right text-muted-foreground">-</div>
      return <div className="text-right font-medium">{rate}%</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const notification = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            {notification.status === "scheduled" && (
              <DropdownMenuItem className="text-amber-600">Cancel Schedule</DropdownMenuItem>
            )}
            {notification.status === "draft" && (
              <DropdownMenuItem className="text-emerald-600">Send Now</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-heading tracking-tight">Push Notifications</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="font-heading">Create Notification</CardTitle>
            <CardDescription>Send a new push notification to your users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Notification Title</Label>
              <Input id="title" placeholder="e.g. Special Offer!" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message Body</Label>
              <Textarea id="message" placeholder="Type your message here..." className="min-h-[100px]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start">
                  <Users className="mr-2 h-4 w-4" /> All Users
                </Button>
                <Button variant="outline" className="justify-start">
                  <Star className="mr-2 h-4 w-4" /> Premium
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost">Save Draft</Button>
            <Button>
              <Send className="mr-2 h-4 w-4" /> Send Now
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading">Notification History</CardTitle>
            <CardDescription>View past and scheduled notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={notificationColumns} data={notificationsData} searchKey="title" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
