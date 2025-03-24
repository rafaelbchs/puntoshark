"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { getThumbnailUrl } from "@/lib/image-utils"
import { Loader2, Trash2, Upload, FolderPlus, RefreshCw, Search, X, Eye } from "lucide-react"
import ProtectedAdminRoute from "@/components/protected-admin-route"

type FileObject = {
  id: string
  name: string
  bucket_id: string
  owner: string
  created_at: string
  updated_at: string
  last_accessed_at: string
  metadata: {
    size: number
    mimetype: string
  }
}

type BucketInfo = {
  id: string
  name: string
  public: boolean
  file_count: number
  size: number
}

export default function StorageManagementPage() {
  const [files, setFiles] = useState<FileObject[]>([])
  const [buckets, setBuckets] = useState<BucketInfo[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string>("products")
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null)
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [currentPath, setCurrentPath] = useState("")

  // Fetch buckets and files on component mount
  useEffect(() => {
    fetchBuckets()
    fetchFiles(selectedBucket, currentPath)
  }, [selectedBucket, currentPath])

  // Fetch storage buckets
  const fetchBuckets = async () => {
    try {
      const { data, error } = await supabase.storage.listBuckets()

      if (error) {
        throw error
      }

      // Get file counts and sizes for each bucket
      const bucketsWithInfo = await Promise.all(
        (data || []).map(async (bucket) => {
          if (!bucket) return null

          try {
            const { data: files, error: filesError } = await supabase.storage.from(bucket.name).list()

            if (filesError) {
              return {
                ...bucket,
                file_count: 0,
                size: 0,
              }
            }

            return {
              ...bucket,
              file_count: files?.length || 0,
              size: (files || []).reduce((total, file) => total + (file?.metadata?.size || 0), 0),
            }
          } catch (err) {
            console.error(`Error getting info for bucket ${bucket.name}:`, err)
            return {
              ...bucket,
              file_count: 0,
              size: 0,
            }
          }
        }),
      )

      setBuckets(bucketsWithInfo.filter(Boolean) as BucketInfo[])
    } catch (error) {
      console.error("Error fetching buckets:", error)
      toast({
        title: "Error",
        description: "Failed to fetch storage buckets",
        variant: "destructive",
      })
    }
  }

  // Fetch files from a bucket
  const fetchFiles = async (bucket: string, path = "") => {
    setLoading(true)
    try {
      const { data, error } = await supabase.storage.from(bucket).list(path, {
        sortBy: { column: "name", order: "asc" },
      })

      if (error) {
        throw error
      }

      // Convert to FileObject format
      const fileObjects = (data || [])
        .map((item) => {
          if (!item) return null

          return {
            id: item.id || `file-${Date.now()}-${Math.random()}`,
            name: item.name || "",
            bucket_id: bucket,
            owner: "",
            created_at: item.created_at || "",
            updated_at: item.updated_at || "",
            last_accessed_at: item.last_accessed_at || "",
            metadata: item.metadata || { size: 0, mimetype: "" },
          }
        })
        .filter(Boolean) as FileObject[]

      setFiles(fileObjects)
    } catch (error) {
      console.error("Error fetching files:", error)
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Create file path
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name

        // Upload file
        const { error } = await supabase.storage.from(selectedBucket).upload(filePath, file)

        if (error) {
          throw error
        }
      }

      // Refresh file list
      fetchFiles(selectedBucket, currentPath)

      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`,
      })
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset file input
      e.target.value = ""
    }
  }

  // Delete a file
  const handleDeleteFile = async (file: FileObject) => {
    try {
      const filePath = currentPath ? `${currentPath}/${file.name}` : file.name

      const { error } = await supabase.storage.from(selectedBucket).remove([filePath])

      if (error) {
        throw error
      }

      // Refresh file list
      fetchFiles(selectedBucket, currentPath)

      toast({
        title: "Success",
        description: "File deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  // Create a new folder
  const handleCreateFolder = async () => {
    if (!newFolderName) {
      toast({
        title: "Error",
        description: "Folder name is required",
        variant: "destructive",
      })
      return
    }

    try {
      // Create an empty file with a folder path to simulate a folder
      const folderPath = currentPath ? `${currentPath}/${newFolderName}/.folder` : `${newFolderName}/.folder`

      const { error } = await supabase.storage.from(selectedBucket).upload(folderPath, new Blob([""]))

      if (error) {
        throw error
      }

      // Refresh file list
      fetchFiles(selectedBucket, currentPath)

      toast({
        title: "Success",
        description: "Folder created successfully",
      })

      // Reset state
      setNewFolderName("")
      setIsCreateFolderDialogOpen(false)
    } catch (error) {
      console.error("Error creating folder:", error)
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      })
    }
  }

  // Navigate to a folder
  const navigateToFolder = (folderName: string) => {
    setCurrentPath(currentPath ? `${currentPath}/${folderName}` : folderName)
  }

  // Navigate up one level
  const navigateUp = () => {
    if (!currentPath) return

    const pathParts = currentPath.split("/")
    pathParts.pop()
    setCurrentPath(pathParts.join("/"))
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Get file URL
  const getFileUrl = (file: FileObject) => {
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name

    const { data } = supabase.storage.from(selectedBucket).getPublicUrl(filePath)

    return data.publicUrl
  }

  // Filter files by search query
  const filteredFiles = files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Check if a file is an image
  const isImage = (file: FileObject) => {
    return file.metadata?.mimetype?.startsWith("image/") || false
  }

  return (
    <ProtectedAdminRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Storage Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => fetchFiles(selectedBucket, currentPath)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="files">
          <TabsList className="mb-4">
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="buckets">Buckets</TabsTrigger>
          </TabsList>

          <TabsContent value="files">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Files in {selectedBucket}</CardTitle>
                    <CardDescription>{currentPath ? `Path: ${currentPath}` : "Root directory"}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsCreateFolderDialogOpen(true)}>
                      <FolderPlus className="h-4 w-4 mr-2" />
                      New Folder
                    </Button>
                    <Button onClick={() => document.getElementById("file-upload")?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {currentPath && (
                    <Button variant="outline" size="sm" onClick={navigateUp}>
                      <span className="mr-1">↑</span> Up
                    </Button>
                  )}
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search files..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-9 w-9"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No files match your search" : "No files found in this directory"}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Type</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Last Modified</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFiles.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>
                            {file.name.endsWith("/") || file.name.endsWith(".folder") ? (
                              <div className="flex justify-center">
                                <FolderPlus className="h-6 w-6 text-blue-500" />
                              </div>
                            ) : isImage(file) ? (
                              <div className="relative h-10 w-10 rounded overflow-hidden">
                                <Image
                                  src={getThumbnailUrl(getFileUrl(file)) || "/placeholder.svg"}
                                  alt={file.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <div className="h-6 w-6 bg-muted rounded flex items-center justify-center text-xs">
                                  {file.name.split(".").pop()?.toUpperCase() || "?"}
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {file.name.endsWith("/") || file.name.endsWith(".folder") ? (
                              <button
                                className="text-blue-500 hover:underline"
                                onClick={() => navigateToFolder(file.name.replace("/.folder", ""))}
                              >
                                {file.name.replace("/.folder", "")}
                              </button>
                            ) : (
                              file.name
                            )}
                          </TableCell>
                          <TableCell>{formatFileSize(file.metadata?.size || 0)}</TableCell>
                          <TableCell>{file.updated_at ? new Date(file.updated_at).toLocaleString() : "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {!file.name.endsWith(".folder") && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedFile(file)
                                    setIsFileDialogOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDeleteFile(file)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buckets">
            <Card>
              <CardHeader>
                <CardTitle>Storage Buckets</CardTitle>
                <CardDescription>Manage your storage buckets</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Public</TableHead>
                      <TableHead>Files</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buckets.map((bucket) => (
                      <TableRow key={bucket.id}>
                        <TableCell className="font-medium">{bucket.name}</TableCell>
                        <TableCell>{bucket.public ? "Yes" : "No"}</TableCell>
                        <TableCell>{bucket.file_count}</TableCell>
                        <TableCell>{formatFileSize(bucket.size)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBucket(bucket.name)
                              setCurrentPath("")
                              fetchFiles(bucket.name)
                            }}
                          >
                            View Files
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* File Preview Dialog */}
        <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedFile?.name}</DialogTitle>
              <DialogDescription>
                {formatFileSize(selectedFile?.metadata?.size || 0)} •
                {selectedFile?.updated_at
                  ? ` Last modified: ${new Date(selectedFile.updated_at).toLocaleString()}`
                  : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedFile && isImage(selectedFile) ? (
                <div className="relative h-[400px] w-full">
                  <Image
                    src={getFileUrl(selectedFile) || "/placeholder.svg"}
                    alt={selectedFile.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] bg-muted rounded-md">
                  <p className="text-muted-foreground">Preview not available</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button asChild>
                <a href={selectedFile ? getFileUrl(selectedFile) : "#"} target="_blank" rel="noopener noreferrer">
                  Open in New Tab
                </a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Folder Dialog */}
        <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>Enter a name for the new folder</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="my-folder"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateFolderDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>Create Folder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedAdminRoute>
  )
}

