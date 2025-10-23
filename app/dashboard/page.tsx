
"use client";

// import ReactSelect from "react-select";
import ReactSelect, { type MultiValue, type SingleValue } from "react-select";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  Upload,
  FileText,
  MessageSquare,
  Key,
  LogOut,
  Trash2,
  AlertCircle,
  FileUp,
  Users,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { AuthWrapper } from "@/components/auth-wrapper";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { StatusIndicator } from "@/components/status-indicator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { log } from "console";
// import { log } from "console"

interface Document {
  id: string;
  _id: string;
  filename: string;
  uploadedAt: string;
  status: "processing" | "ready" | "error";
  content?: string;
  chunks?: number;
  path?: string;
}

interface OptionType {
  label: string;
  value: string;
}


interface UserInfo {
  totalUsers: number;
  users: Array<{
    id: string;
    _id: string;
    username: string;
    email: string;
    createdAt: string;
    token: string;
  }>;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedModel, setSelectedModel] = useState("llama3-8b-8192");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [showPdfHelper, setShowPdfHelper] = useState(false);

  // For PDF helper dialog file and filename
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualFilename, setManualFilename] = useState("");

  const [userInfo, setUserInfo] = useState<UserInfo>({
    totalUsers: 0,
    users: [],
  });
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  const llmModels: string[] = ["LLM3 model"];
  const storedFiles: string[] = ["file1.pdf", "file2.docx", "file3.txt"];
  const fileOptions = storedFiles.map((file) => ({ label: file, value: file }));
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  // const [selectedFiles, setSelectedFiles] = useState<OptionType[]>([]);
  const options: OptionType[] = storedFiles.map((file) => ({ label: file, value: file }));
  const documentOptions: OptionType[] = documents.map(doc => ({
  value: doc.filename, // or doc.id if you want unique id
  label: doc.filename
}));


  const [apiKey, setApiKey] = useState("");

// Generate API key button handler
const handleGenerateKey = async () => {
  if (!user?._id) return;
  if (selectedFiles.length === 0) {
    alert("Please select at least one file.");
    return;
  }

  try {
     const payload = {
      userId: user._id,
      documents: selectedFiles.map((file) => ({
        filename: file,
        path: `/uploaded_files/${file}`, // optional: store path if you want
      })),
    };

    // const response = await fetch("http://127.0.0.1:8000/apikeys/generate-api-key", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     userId: user._id,
    //     documents: selectedFiles.map((file) => ({
    //       filename: file,
    //       path: `/uploaded_files/${file}`,
    //     })),
    //   }),
    // });
    const response = await fetch(
      "http://127.0.0.1:8000/apikeys/generate-api-key",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );


    const data = await response.json();
    if (response.ok) {
      setApiKey(data.api_key);
    } else {
      console.error("API key generation failed", data);
    }
  } catch (error) {
    console.error("Error generating API key", error);
  }
};




  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  const fetchUserInfo = async () => {
    try {
      const response = await fetch("/api/debug/users");
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      if (data && typeof data === "object") {
        setUserInfo({
          totalUsers: data.totalUsers || 0,
          users: Array.isArray(data.users) ? data.users : [],
        });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      setUserInfo({ totalUsers: 0, users: [] });
    }
  };

  const fetchDocuments = async () => {
    if (!user?.id) {
      setDocuments([]);
      return;
    }

    setIsLoadingDocuments(true);
    try {
      const token = user?.token; // Make sure your useAuth context provides the JWT token

      const response = await fetch(
        `http://127.0.0.1:8000/documents/?userId=${user?._id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(response);
        throw new Error(
          `API error: ${response.status}, ${
            data?.error || JSON.stringify(data)
          }`
        );
      }

      if (data && Array.isArray(data.documents)) {
        setDocuments(data.documents);
        console.log(
          `📄 Fetched ${data.documents.length} documents for user ${user.id}`
        );
      } else {
        console.error(
          "Error fetching documents:",
          data?.error || "Invalid response format"
        );
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    fetchDocuments();
  }, [user?.id]);

  // When file is selected from file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Use first file only for dialog
    setSelectedFile(files[0]);
    setManualFilename(files[0].name);
    setShowPdfHelper(true);
  };

  // Upload file to backend with the filename from dialog
  // const handleManualTextUpload = async () => {
  //   if (!selectedFile) return;

  //   setIsUploading(true);
  //   setUploadProgress(0);
  //   setUploadStatus("Uploading...");

  //   try {
  //     const userId = user?._id || "demo-user-1";
  //     const token = user?.token;

  //     console.log(token);
  //     if (!token) {
  //       console.error(
  //         "❌ No token found. User may not be authenticated.",
  //         token
  //       );
  //       setUploadStatus("Unauthorized: Please log in again.");
  //       setIsUploading(false);
  //       return;
  //     }

  //     // Create new file with name entered by user in dialog
  //     const fileToUpload = new File([selectedFile], manualFilename);
  //     // print(fileToUpload)
  //     const formData = new FormData();
  //     formData.append("file", fileToUpload);
  //     formData.append("userId", user?._id);

  //     console.log("📤 Uploading file:", fileToUpload.name);
  //     console.log("🧠 Token used:", token);

  //     console.log(selectedFile);
  //     const response = await fetch("http://127.0.0.1:8000/documents/upload", {
  //       method: "POST",
  //       headers: {
  //         Authorization: `Bearer ${token}`, // ✅ Added token
  //       },
  //       body: formData,
  //     });

  //     setUploadProgress(70);

  //     if (!response.ok) {
  //       console.log(response.body);

  //       throw new Error(
  //         `Upload failed: ${response.status} ${response.statusText}`
  //       );
  //     }

  //     const result = await response.json();

  //     if (result.success) {
  //       // Close dialog and refresh documents
  //       setShowPdfHelper(false);
  //       setSelectedFile(null);
  //       setManualFilename("");
  //       fetchDocuments();
  //       setUploadStatus(`Successfully uploaded ${fileToUpload.name}`);
  //     } else {
  //       throw new Error(result.error || "Upload failed");
  //     }

  //     setUploadProgress(100);
  //   } catch (error) {
  //     console.error("❌ Upload error:", error);
  //     setUploadStatus(`Error uploading: ${(error as Error).message}`);
  //   }

  //   setIsUploading(false);
  //   setUploadProgress(0);
  // };




  const handleManualTextUpload = async () => {
  if (!selectedFile) return;

  setIsUploading(true);
  setUploadProgress(0);
  setUploadStatus("Uploading...");

  try {
    const userId = user?._id || "demo-user-1";
    const token = user?.token;

    if (!token) {
      setUploadStatus("Unauthorized: Please log in again.");
      setIsUploading(false);
      return;
    }

    // Create new file with user-entered filename
    const fileToUpload = new File([selectedFile], manualFilename);
    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("userId", userId);

    console.log("📤 Uploading file:", fileToUpload.name);

    // ✅ 1. FIRST: Store locally via documents/upload
    const localResponse = await fetch("http://127.0.0.1:8000/documents/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    setUploadProgress(50);

    if (!localResponse.ok) {
      throw new Error(`Local storage failed: ${localResponse.status}`);
    }

    const localResult = await localResponse.json();
    const documentId = localResult.document?.id;

    if (!documentId) {
      throw new Error("No document ID returned from local storage");
    }

    setUploadProgress(70);
    setUploadStatus("Processing for vector storage...");

    // ✅ 2. SECOND: Process for vector storage via upload_and_embed
    const vectorFormData = new FormData();
    vectorFormData.append("file", fileToUpload);
    vectorFormData.append("user_id", userId);
    vectorFormData.append("api_key", `kn_${userId}_api_key`);
    // vectorFormData.append("doc_id", documentId);

    const vectorResponse = await fetch("http://127.0.0.1:8000/upload_and_embed", {
      method: "POST",
      body: vectorFormData  // No auth needed for this endpoint
    });

    setUploadProgress(90);

    if (!vectorResponse.ok) {
      console.log(vectorResponse.json);
      
      throw new Error(`Vector storage failed: ${vectorResponse.status}`);
    }

    const vectorResult = await vectorResponse.json();

    // ✅ SUCCESS: Both storage complete
    setShowPdfHelper(false);
    setSelectedFile(null);
    setManualFilename("");
    fetchDocuments(); // Refresh the document list
    setUploadStatus(`Successfully uploaded and processed ${fileToUpload.name}`);
    setUploadProgress(100);

  } catch (error) {
    console.error("❌ Upload error:", error);
    setUploadStatus(`Error: ${(error as Error).message}`);
  }

  setIsUploading(false);
  setUploadProgress(0);
};









  const handleDeleteDocument = async (docId: string) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/documents?id=${docId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
        console.log(`✅ Document ${docId} deleted successfully`);
      } else {
        console.error(`❌ Failed to delete document ${docId}`);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  // Safely get document counts
  const getReadyDocumentCount = () => {
    if (!Array.isArray(documents)) return 0;
    return documents.filter((doc) => doc.status === "ready").length;
  };

  const getDocumentCount = () => {
    if (!Array.isArray(documents)) return 0;
    return documents.length;
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">Knaible</span>
              <StatusIndicator />
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <div className="font-medium">{user?.username || "User"}</div>
                <div className="text-xs text-gray-500">
                  {user?.email || "No email"}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Upload documents and ask questions about their content
            </p>
          </div>

          <Tabs defaultValue="documents" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="api">API Access</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="debug">Debug</TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Documents
                  </CardTitle>
                  <CardDescription>
                    Upload text files (.txt) for best results. PDF and DOCX
                    files are supported but may have limited text extraction.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="file-upload">Upload Files</Label>
                        <Input
                          id="file-upload"
                          type="file"
                          multiple={false}
                          accept=".pdf,.docx,.txt"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{uploadStatus}</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Your Documents ({getDocumentCount()})
                    </CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchDocuments}
                    disabled={isLoadingDocuments}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        isLoadingDocuments ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoadingDocuments ? (
                    <div className="text-center py-8">
                      <div className="h-8 w-8 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading documents...</p>
                    </div>
                  ) : !Array.isArray(documents) || documents.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No documents uploaded yet. Upload your first document to
                      start asking questions about it!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc, idx) => (
                        <div
                          key={doc.id || idx}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div className="flex-1">
                              {/* Make filename clickable */}
                              {doc.path ? (
                                <a
                                  href={doc.path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-600 hover:underline"
                                >
                                  {doc.filename}
                                </a>
                              ) : (
                                <p className="font-medium">{doc.filename}</p>
                              )}

                              <p className="text-sm text-gray-500">
                                Uploaded{" "}
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                                {doc.chunks &&
                                  ` • ${doc.chunks} chunks processed`}
                              </p>

                              {doc.content && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {doc.content}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                doc.status === "ready"
                                  ? "default"
                                  : doc.status === "error"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {doc.status === "ready" && "✓ Ready"}
                              {doc.status === "processing" && "⏳ Processing"}
                              {doc.status === "error" && "❌ Error"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
                              title="Delete document"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="chat">
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                     Chat with Your Documents
                   </CardTitle>
                   <CardDescription>
                    Ask questions about your uploaded documents. The AI will analyze the content and provide answers
                    based on what you've uploaded.
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                  {getReadyDocumentCount() === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">
                        No documents ready for chat. Upload and process documents first.
                      </p>
                      <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                        Upload Documents
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">
                        You have {getReadyDocumentCount()} document(s) ready for questions.
                      </p>
                      <Link href="/chat">
                        <Button size="lg">
                          <MessageSquare className="h-5 w-5 mr-2" />
                          Start Chatting
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

<TabsContent value="api">
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <Key className="h-5 w-5 mr-2" />
        API Access
      </CardTitle>
      <CardDescription>
        Use your API key to integrate your chatbot into external applications
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-4">
      {/* API Key */}
      <div>
        <Label>Your API Key</Label>
        <div className="flex space-x-2">
          <Input
            value={`kn_${user?._id || "user"}_api_key`}
            readOnly
            className="font-mono"
          />
          <Button
            variant="outline"
            onClick={() =>
              navigator.clipboard.writeText(`kn_${user?._id || "user"}_api_key`)
            }
          >
            Copy
          </Button>
        </div>
      </div>

      {/* LLM Model Select */}
      <div>
        <Label>Choose LLM Model</Label>
        <ReactSelect<OptionType, false>
          options={llmModels.map((model) => ({ value: model, label: model }))}
          value={
            selectedModel
              ? { value: selectedModel, label: selectedModel }
              : null
          }
          onChange={(option: SingleValue<OptionType>) =>
            setSelectedModel(option?.value || "")
          }
          placeholder="Select a model"
          isClearable
        />
      </div>

      {/* Stored Files Multi-Select */}
      <div>
        <Label>Select Stored File(s)</Label>
       <ReactSelect<OptionType, true>
  isMulti
  options={documentOptions}
  value={documentOptions.filter(option => selectedFiles.includes(option.value))}
  onChange={(options: MultiValue<OptionType>) =>
    setSelectedFiles(options.map(o => o.value))
  }
  placeholder="Select files"
/>
      </div>

      {/* Example Usage */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Example Usage</h4>
        <pre className="text-sm text-gray-600 overflow-x-auto">
          {`curl -X POST https://api.knaible.com/v1/chat \\
-H "Authorization: Bearer kn_${user?._id || "user"}_api_key" \\
-H "Content-Type: application/json" \\
-d '{
  "message": "What is this document about?",
  "model": "${selectedModel}",
  "files": ${JSON.stringify(selectedFiles)}
}'`}
        </pre>
      </div>
    </CardContent>
     <Button onClick={handleGenerateKey} variant="default">
        Generate API Key
      </Button>
  </Card>
</TabsContent>

          </Tabs>
        </div>
      </div>

      {/* PDF Helper Dialog */}
      <Dialog open={showPdfHelper} onOpenChange={setShowPdfHelper}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>PDF Text Extraction</DialogTitle>
            <DialogDescription>
              Extract text from PDFs or enter document content manually for
              better results
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="manual-filename">Document Name</Label>
              <Input
                id="manual-filename"
                value={manualFilename}
                onChange={(e) => setManualFilename(e.target.value)}
                placeholder="Enter a name for this document"
              />
            </div>

            {/* Removed Document Content Textarea as requested */}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPdfHelper(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleManualTextUpload}
                disabled={!manualFilename.trim() || isUploading}
              >
                Upload Content
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AuthWrapper>
  );
}

// "use client"

// import type React from "react"

// import { useState, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Badge } from "@/components/ui/badge"
// import { Progress } from "@/components/ui/progress"
// import {
//   Bot,
//   Upload,
//   FileText,
//   MessageSquare,
//   Key,
//   LogOut,
//   Trash2,
//   AlertCircle,
//   FileUp,
//   Users,
//   RefreshCw,
// } from "lucide-react"
// import Link from "next/link"
// import { AuthWrapper } from "@/components/auth-wrapper"
// import { useAuth } from "@/contexts/auth-context"
// import { useRouter } from "next/navigation"
// import { StatusIndicator } from "@/components/status-indicator"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// interface Document {
//   id: string
//   filename: string
//   uploadedAt: string
//   status: "processing" | "ready" | "error"
//   content?: string
//   chunks?: number
// }

// interface UserInfo {
//   totalUsers: number
//   users: Array<{
//     id: string
//     username: string
//     email: string
//     createdAt: string
//   }>
// }

// export default function DashboardPage() {
//   const { user, logout } = useAuth()
//   const router = useRouter()
//   const [documents, setDocuments] = useState<Document[]>([])
//   const [selectedModel, setSelectedModel] = useState("llama3-8b-8192")
//   const [isUploading, setIsUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState(0)
//   const [uploadStatus, setUploadStatus] = useState("")
//   const [showPdfHelper, setShowPdfHelper] = useState(false)
//   const [manualText, setManualText] = useState("")
//   const [manualFilename, setManualFilename] = useState("")
//   const [userInfo, setUserInfo] = useState<UserInfo>({ totalUsers: 0, users: [] })
//   const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)

//   const handleSignOut = () => {
//     logout()
//     router.push("/")
//   }

//   const fetchUserInfo = async () => {
//     try {
//       const response = await fetch("/api/debug/users")
//       if (!response.ok) {
//         throw new Error(`API error: ${response.status}`)
//       }
//       const data = await response.json()
//       if (data && typeof data === "object") {
//         setUserInfo({
//           totalUsers: data.totalUsers || 0,
//           users: Array.isArray(data.users) ? data.users : [],
//         })
//       }
//     } catch (error) {
//       console.error("Error fetching user info:", error)
//       // Set default values on error
//       setUserInfo({ totalUsers: 0, users: [] })
//     }
//   }

//   const fetchDocuments = async () => {
//     if (!user?.id) {
//       setDocuments([])
//       return
//     }

//     setIsLoadingDocuments(true)
//     try {
//       const response = await fetch(`http://127.0.0.1:8000/documents?userId=${user?.id}`)
//       if (!response.ok) {
//         throw new Error(`API error: ${response.status}`)
//       }

//       const data = await response.json()

//       if (data && data.success && Array.isArray(data.documents)) {
//         setDocuments(data.documents)
//         console.log(`📄 Fetched ${data.documents.length} documents for user ${user.id}`)
//       } else {
//         console.error("Error fetching documents:", data?.error || "Invalid response format")
//         setDocuments([])
//       }
//     } catch (error) {
//       console.error("Error fetching documents:", error)
//       setDocuments([])
//     } finally {
//       setIsLoadingDocuments(false)
//     }
//   }

//   useEffect(() => {
//     fetchUserInfo()
//     fetchDocuments()
//   }, [user?.id])

//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files
//     if (!files || files.length === 0) return

//     // Check if any of the files are PDFs
//     const hasPdf = Array.from(files).some(
//       (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
//     )

//     if (hasPdf) {
//       setShowPdfHelper(true)
//       return
//     }

//     await processFiles(files)
//   }

//   const processFiles = async (files: FileList | File[]) => {
//     setIsUploading(true)
//     setUploadProgress(0)

//     for (const file of files) {
//       try {
//         const userId = user?.id || "demo-user-1"
//         console.log(`📤 [UPLOAD] Starting upload for user ${userId}, file: ${file.name}`)

//         // Add document with processing status
//         const docId = Math.random().toString(36).substr(2, 9)
//         const newDoc: Document = {
//           id: docId,
//           filename: file.name,
//           uploadedAt: new Date().toISOString(),
//           status: "processing",
//         }

//         setDocuments((prev) => [...(Array.isArray(prev) ? prev : []), newDoc])

//         setUploadStatus(`Processing ${file.name}...`)
//         setUploadProgress(20)

//         // Create FormData and send to API
//         const formData = new FormData()
//         formData.append("file", file)
//         formData.append("userId", userId)

//         console.log(`📤 [UPLOAD] Sending to API: /api/documents/upload`)

//         const response = await fetch("/api/documents/upload", {
//           method: "POST",
//           body: formData,
//         })

//         setUploadProgress(60)

//         if (!response.ok) {
//           throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
//         }

//         const result = await response.json()
//         console.log(`✅ [UPLOAD] API response:`, result)

//         setUploadProgress(80)

//         if (result.success) {
//           // Update document status
//           setDocuments((prev) => {
//             if (!Array.isArray(prev))
//               return [
//                 {
//                   ...newDoc,
//                   id: result.document.id,
//                   status: "ready",
//                   content: `Document processed successfully. Vector stored: ${result.vectorStored}`,
//                   chunks: result.chunksCount || 1,
//                 },
//               ]

//             return prev.map((doc) =>
//               doc.id === docId
//                 ? {
//                     ...doc,
//                     id: result.document.id, // Use the ID from the server
//                     status: "ready",
//                     content: `Document processed successfully. Vector stored: ${result.vectorStored}`,
//                     chunks: result.chunksCount || 1,
//                   }
//                 : doc,
//             )
//           })
//           setUploadStatus(`Successfully processed ${file.name}`)
//           console.log(`✅ [UPLOAD] Successfully processed ${file.name} for user ${userId}`)
//         } else {
//           throw new Error(result.error || "Upload failed")
//         }

//         setUploadProgress(100)
//         await new Promise((resolve) => setTimeout(resolve, 500))
//       } catch (error) {
//         console.error("❌ [UPLOAD] Upload error:", error)
//         setUploadStatus(`Error uploading ${file.name}: ${(error as Error).message}`)

//         // Update document status to error
//         setDocuments((prev) => {
//           if (!Array.isArray(prev)) return []
//           return prev.map((doc) => (doc.filename === file.name ? { ...doc, status: "error" } : doc))
//         })
//       }
//     }

//     setIsUploading(false)
//     setUploadProgress(0)
//     setUploadStatus("")
//   }

//   const handleManualTextUpload = async () => {
//     if (!manualText.trim()) return

//     setIsUploading(true)
//     setUploadProgress(10)

//     try {
//       const userId = user?.id || "demo-user-1"
//       const filename = manualFilename || "manual-text.txt"

//       // Create a text file from the manual input
//       const file = new File([manualText], filename, { type: "text/plain" })

//       // Add document with processing status
//       const docId = Math.random().toString(36).substr(2, 9)
//       const newDoc: Document = {
//         id: docId,
//         filename,
//         uploadedAt: new Date().toISOString(),
//         status: "processing",
//       }

//       setDocuments((prev) => [...(Array.isArray(prev) ? prev : []), newDoc])

//       setUploadStatus(`Processing ${filename}...`)
//       setUploadProgress(30)

//       // Create FormData and send to API
//       const formData = new FormData()
//       formData.append("file", file)
//       formData.append("userId", userId)

//       const response = await fetch("/api/documents/upload", {
//         method: "POST",
//         body: formData,
//       })

//       setUploadProgress(70)

//       if (!response.ok) {
//         throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
//       }

//       const result = await response.json()
//       setUploadProgress(90)

//       if (result.success) {
//         // Update document status
//         setDocuments((prev) => {
//           if (!Array.isArray(prev))
//             return [
//               {
//                 ...newDoc,
//                 id: result.document.id,
//                 status: "ready",
//                 content: `Document processed successfully. Vector stored: ${result.vectorStored}`,
//                 chunks: result.chunksCount || 1,
//               },
//             ]

//           return prev.map((doc) =>
//             doc.id === docId
//               ? {
//                   ...doc,
//                   id: result.document.id,
//                   status: "ready",
//                   content: `Document processed successfully. Vector stored: ${result.vectorStored}`,
//                   chunks: result.chunksCount || 1,
//                 }
//               : doc,
//           )
//         })

//         setUploadStatus(`Successfully processed ${filename}`)

//         // Reset manual text fields
//         setManualText("")
//         setManualFilename("")
//         setShowPdfHelper(false)
//       } else {
//         throw new Error(result.error || "Upload failed")
//       }

//       setUploadProgress(100)
//       await new Promise((resolve) => setTimeout(resolve, 500))
//     } catch (error) {
//       console.error("❌ [UPLOAD] Manual text upload error:", error)
//       setUploadStatus(`Error uploading text: ${(error as Error).message}`)
//     }

//     setIsUploading(false)
//     setUploadProgress(0)
//     setUploadStatus("")
//   }

//   const handleDeleteDocument = async (docId: string) => {
//     try {
//       const response = await fetch(`/api/documents?id=${docId}`, {
//         method: "DELETE",
//       })

//       if (response.ok) {
//         setDocuments((prev) => {
//           if (!Array.isArray(prev)) return []
//           return prev.filter((doc) => doc.id !== docId)
//         })
//         console.log(`✅ Document ${docId} deleted successfully`)
//       } else {
//         console.error(`❌ Failed to delete document ${docId}`)
//       }
//     } catch (error) {
//       console.error("Error deleting document:", error)
//     }
//   }

//   const handlePdfTextExtracted = (text: string) => {
//     setManualText(text)
//     setManualFilename("extracted-pdf-content.txt")
//     setShowPdfHelper(false)
//   }

//   // Safely get document counts
//   const getReadyDocumentCount = () => {
//     if (!Array.isArray(documents)) return 0
//     return documents.filter((doc) => doc.status === "ready").length
//   }

//   const getDocumentCount = () => {
//     if (!Array.isArray(documents)) return 0
//     return documents.length
//   }

//   return (
//     <AuthWrapper>
//       <div className="min-h-screen bg-gray-50">
//         {/* Header */}
//         <header className="bg-white border-b">
//           <div className="container mx-auto px-4 py-4 flex justify-between items-center">
//             <div className="flex items-center space-x-2">
//               <Bot className="h-8 w-8 text-blue-600" />
//               <span className="text-2xl font-bold">Knaible</span>
//               <StatusIndicator />
//             </div>
//             <div className="flex items-center space-x-4">
//               <div className="text-sm text-gray-600">
//                 <div className="font-medium">{user?.username || "User"}</div>
//                 <div className="text-xs text-gray-500">{user?.email || "No email"}</div>
//               </div>
//               <Button variant="ghost" size="sm" onClick={handleSignOut}>
//                 <LogOut className="h-4 w-4 mr-2" />
//                 Sign Out
//               </Button>
//             </div>
//           </div>
//         </header>

//         <div className="container mx-auto px-4 py-8">
//           <div className="mb-8">
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
//             <p className="text-gray-600">Upload documents and ask questions about their content</p>
//           </div>

//           <Tabs defaultValue="documents" className="space-y-6">
//             <TabsList className="grid w-full grid-cols-5">
//               <TabsTrigger value="documents">Documents</TabsTrigger>
//               <TabsTrigger value="chat">Chat</TabsTrigger>
//               <TabsTrigger value="api">API Access</TabsTrigger>
//               <TabsTrigger value="settings">Settings</TabsTrigger>
//               <TabsTrigger value="debug">Debug</TabsTrigger>
//             </TabsList>

//             <TabsContent value="documents" className="space-y-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center">
//                     <Upload className="h-5 w-5 mr-2" />
//                     Upload Documents
//                   </CardTitle>
//                   <CardDescription>
//                     Upload text files (.txt) for best results. PDF and DOCX files are supported but may have limited
//                     text extraction.
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-4">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <Label htmlFor="file-upload">Upload Files</Label>
//                         <Input
//                           id="file-upload"
//                           type="file"
//                           multiple
//                           accept=".pdf,.docx,.txt"
//                           onChange={handleFileUpload}
//                           disabled={isUploading}
//                           className="w-full"
//                         />
//                       </div>

//                       {/* <div>
//                         <Label htmlFor="manual-upload">Or Enter Text Directly</Label>
//                         <div className="flex space-x-2">
//                           <Button variant="outline" className="w-full" onClick={() => setShowPdfHelper(true)}>
//                             <FileUp className="h-4 w-4 mr-2" />
//                             Manual Text Entry
//                           </Button>
//                         </div>
//                       </div> */}
//                     </div>

//                     {isUploading && (
//                       <div className="space-y-2">
//                         <div className="flex justify-between text-sm">
//                           <span>{uploadStatus}</span>
//                           <span>{uploadProgress}%</span>
//                         </div>
//                         <Progress value={uploadProgress} />
//                       </div>
//                     )}

//                     {/* <div className="bg-blue-50 p-3 rounded-lg">
//                       <p className="text-sm text-blue-700">
//                         <strong>Tip:</strong> For best results with PDFs, use the Manual Text Entry option and
//                         copy-paste the content directly. This ensures the AI can properly analyze your document content.
//                       </p>
//                     </div> */}
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader className="flex flex-row items-center justify-between">
//                   <div>
//                     <CardTitle className="flex items-center">
//                       <FileText className="h-5 w-5 mr-2" />
//                       Your Documents ({getDocumentCount()})
//                     </CardTitle>
//                   </div>
//                   <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={isLoadingDocuments}>
//                     <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingDocuments ? "animate-spin" : ""}`} />
//                     Refresh
//                   </Button>
//                 </CardHeader>
//                 <CardContent>
//                   {isLoadingDocuments ? (
//                     <div className="text-center py-8">
//                       <div className="h-8 w-8 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
//                       <p className="text-gray-500">Loading documents...</p>
//                     </div>
//                   ) : !Array.isArray(documents) || documents.length === 0 ? (
//                     <p className="text-gray-500 text-center py-8">
//                       No documents uploaded yet. Upload your first document to start asking questions about it!
//                     </p>
//                   ) : (
//                     <div className="space-y-3">
//                       {documents.map((doc) => (
//                         <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
//                           <div className="flex items-center space-x-3">
//                             <FileText className="h-5 w-5 text-gray-400" />
//                             <div className="flex-1">
//                               <p className="font-medium">{doc.filename}</p>
//                               <p className="text-sm text-gray-500">
//                                 Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
//                                 {doc.chunks && ` • ${doc.chunks} chunks processed`}
//                               </p>
//                               {doc.content && <p className="text-xs text-gray-400 mt-1">{doc.content}</p>}
//                             </div>
//                           </div>
//                           <div className="flex items-center space-x-2">
//                             <Badge
//                               variant={
//                                 doc.status === "ready"
//                                   ? "default"
//                                   : doc.status === "error"
//                                     ? "destructive"
//                                     : "secondary"
//                               }
//                             >
//                               {doc.status === "ready" && "✓ Ready"}
//                               {doc.status === "processing" && "⏳ Processing"}
//                               {doc.status === "error" && "❌ Error"}
//                             </Badge>
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => handleDeleteDocument(doc.id)}
//                               title="Delete document"
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </Button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </TabsContent>

//             <TabsContent value="chat">
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center">
//                     <MessageSquare className="h-5 w-5 mr-2" />
//                     Chat with Your Documents
//                   </CardTitle>
//                   <CardDescription>
//                     Ask questions about your uploaded documents. The AI will analyze the content and provide answers
//                     based on what you've uploaded.
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   {getReadyDocumentCount() === 0 ? (
//                     <div className="text-center py-8">
//                       <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                       <p className="text-gray-500 mb-4">
//                         No documents ready for chat. Upload and process documents first.
//                       </p>
//                       <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
//                         Upload Documents
//                       </Button>
//                     </div>
//                   ) : (
//                     <div className="text-center py-8">
//                       <p className="text-gray-600 mb-4">
//                         You have {getReadyDocumentCount()} document(s) ready for questions.
//                       </p>
//                       <Link href="/chat">
//                         <Button size="lg">
//                           <MessageSquare className="h-5 w-5 mr-2" />
//                           Start Chatting
//                         </Button>
//                       </Link>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </TabsContent>

//             <TabsContent value="api">
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center">
//                     <Key className="h-5 w-5 mr-2" />
//                     API Access
//                   </CardTitle>
//                   <CardDescription>
//                     Use your API key to integrate your chatbot into external applications
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div>
//                     <Label>Your API Key</Label>
//                     <div className="flex space-x-2">
//                       <Input value={`kn_${user?.id || "user"}_api_key`} readOnly className="font-mono" />
//                       <Button variant="outline">Copy</Button>
//                     </div>
//                   </div>
//                   <div className="bg-gray-50 p-4 rounded-lg">
//                     <h4 className="font-medium mb-2">Example Usage</h4>
//                     <pre className="text-sm text-gray-600 overflow-x-auto">
//                       {`curl -X POST https://api.knaible.com/v1/chat \\
//   -H "Authorization: Bearer kn_${user?.id || "user"}_api_key" \\
//   -H "Content-Type: application/json" \\
//   -d '{
//     "message": "What is this document about?",
//     "model": "llama3-8b-8192"
//   }'`}
//                     </pre>
//                   </div>
//                 </CardContent>
//               </Card>
//             </TabsContent>

//             <TabsContent value="settings">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Chatbot Settings</CardTitle>
//                   <CardDescription>Configure your chatbot's behavior and model selection</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div>
//                     <Label htmlFor="model-select">Language Model</Label>
//                     <Select value={selectedModel} onValueChange={setSelectedModel}>
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="llama3-8b-8192">Llama 3 8B (Fast & Free)</SelectItem>
//                         <SelectItem value="llama3-70b-8192">Llama 3 70B (Powerful)</SelectItem>
//                         <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B (Long Context)</SelectItem>
//                         <SelectItem value="gemma-7b-it">Gemma 7B (Google)</SelectItem>
//                       </SelectContent>
//                     </Select>
//                     <p className="text-sm text-gray-500 mt-1">
//                       All models are provided free by Groq with fast inference
//                     </p>
//                   </div>
//                   <Button>Save Settings</Button>
//                 </CardContent>
//               </Card>
//             </TabsContent>

//             <TabsContent value="debug">
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center">
//                     <Users className="h-5 w-5 mr-2" />
//                     User Database Debug
//                   </CardTitle>
//                   <CardDescription>View registered users and database status</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div className="flex justify-between items-center">
//                     <span className="font-medium">Total Users:</span>
//                     <Badge variant="default">{userInfo?.totalUsers || 0}</Badge>
//                   </div>

//                   {userInfo && Array.isArray(userInfo.users) && userInfo.users.length > 0 ? (
//                     <div className="space-y-2">
//                       <h4 className="font-medium">Registered Users:</h4>
//                       {userInfo.users.map((user) => (
//                         <div key={user.id} className="p-3 border rounded-lg">
//                           <div className="flex justify-between items-start">
//                             <div>
//                               <p className="font-medium">{user.username}</p>
//                               <p className="text-sm text-gray-500">{user.email}</p>
//                               <p className="text-xs text-gray-400">
//                                 Created: {new Date(user.createdAt).toLocaleDateString()}
//                               </p>
//                             </div>
//                             <Badge variant="outline" className="text-xs">
//                               {user.id}
//                             </Badge>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <p className="text-gray-500 text-center py-4">No users registered yet.</p>
//                   )}

//                   <Button variant="outline" onClick={fetchUserInfo}>
//                     Refresh User Data
//                   </Button>
//                 </CardContent>
//               </Card>
//             </TabsContent>
//           </Tabs>
//         </div>
//       </div>

//       {/* PDF Helper Dialog */}
//       <Dialog open={showPdfHelper} onOpenChange={setShowPdfHelper}>
//         <DialogContent className="max-w-3xl">
//           <DialogHeader>
//             <DialogTitle>PDF Text Extraction</DialogTitle>
//             <DialogDescription>
//               Extract text from PDFs or enter document content manually for better results
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-4">
//             <div className="grid grid-cols-1 gap-4">
//               <div>
//                 <Label htmlFor="manual-filename">Document Name</Label>
//                 <Input
//                   id="manual-filename"
//                   value={manualFilename}
//                   onChange={(e) => setManualFilename(e.target.value)}
//                   placeholder="Enter a name for this document"
//                 />
//               </div>

//               <div>
//                 <Label htmlFor="manual-text">Document Content</Label>
//                 <textarea
//                   id="manual-text"
//                   value={manualText}
//                   onChange={(e) => setManualText(e.target.value)}
//                   placeholder="Paste or type your document content here..."
//                   className="w-full min-h-[300px] p-2 border rounded-md"
//                 />
//               </div>
//             </div>

//             <div className="flex justify-end space-x-2">
//               <Button variant="outline" onClick={() => setShowPdfHelper(false)}>
//                 Cancel
//               </Button>
//               <Button onClick={handleManualTextUpload} disabled={!manualText.trim()}>
//                 Upload Content
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </AuthWrapper>
//   )
// }
