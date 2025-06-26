import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Clock, User, Send, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

interface CommentsAuditLogProps {
  purchaseRequestId: number;
  canComment?: boolean;
}

interface Comment {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  comment: string;
  createdAt: string;
  type: "comment" | "status_change" | "approval" | "rejection";
}

interface AuditEntry {
  id: number;
  userId: number;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
}

export function CommentsAuditLog({ purchaseRequestId, canComment = true }: CommentsAuditLogProps) {
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"comments" | "audit">("comments");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: [`/api/purchase-requests/${purchaseRequestId}/comments`],
  });

  const { data: auditLog, isLoading: loadingAudit } = useQuery({
    queryKey: [`/api/purchase-requests/${purchaseRequestId}/audit`],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      return apiRequest("POST", `/api/purchase-requests/${purchaseRequestId}/comments`, {
        comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/purchase-requests/${purchaseRequestId}/comments`] 
      });
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "approved":
      case "approve":
        return "bg-green-100 text-green-800";
      case "rejected":
      case "reject":
        return "bg-red-100 text-red-800";
      case "submitted":
      case "submit":
        return "bg-blue-100 text-blue-800";
      case "returned":
      case "return":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: formatDate(date),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Communication & Audit Trail
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={activeTab === "comments" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("comments")}
            >
              Comments ({Array.isArray(comments) ? comments.length : 0})
            </Button>
            <Button
              variant={activeTab === "audit" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("audit")}
            >
              <History className="h-4 w-4 mr-1" />
              Audit ({Array.isArray(auditLog) ? auditLog.length : 0})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === "comments" ? (
          <div className="space-y-4">
            {/* Add New Comment */}
            {canComment && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="mb-3"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                  </Button>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {loadingComments ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : Array.isArray(comments) && comments.length > 0 ? (
                comments.map((comment: Comment) => {
                  const { date, time } = formatDateTime(comment.createdAt);
                  const isAdminComment = comment.userRole === 'admin' || comment.userRole === 'approver';
                  const isActionComment = comment.type !== 'comment';
                  
                  return (
                    <div key={comment.id} className={`border rounded-lg p-4 ${
                      isAdminComment && isActionComment 
                        ? 'border-red-200 bg-red-50' 
                        : isAdminComment 
                        ? 'border-blue-200 bg-blue-50' 
                        : 'bg-white'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isAdminComment ? 'bg-red-500' : 'bg-[hsl(207,90%,54%)]'
                          }`}>
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{comment.userName}</div>
                            <div className="text-xs text-gray-500">{comment.userRole}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">{date}</div>
                          <div className="text-xs text-gray-500">{time}</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{comment.comment}</p>
                      {comment.type !== "comment" && (
                        <Badge className={`mt-2 ${getActionColor(comment.type)}`}>
                          {comment.type.replace("_", " ").toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No comments yet</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {loadingAudit ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : Array.isArray(auditLog) && auditLog.length > 0 ? (
              <div className="space-y-3">
                {auditLog.map((entry: AuditEntry, index: number) => {
                  const { date, time } = formatDateTime(entry.timestamp);
                  return (
                    <div key={entry.id} className="relative">
                      {index !== auditLog.length - 1 && (
                        <div className="absolute left-4 top-8 w-px h-8 bg-gray-200"></div>
                      )}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Clock className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{entry.userName}</span>
                              <Badge className={getActionColor(entry.action)}>
                                {entry.action}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              {date} at {time}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{entry.details}</p>
                          {entry.oldValue && entry.newValue && (
                            <div className="text-xs text-gray-500 mt-2">
                              <span className="line-through">{entry.oldValue}</span>
                              <span className="mx-2">→</span>
                              <span className="font-medium">{entry.newValue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No audit entries yet</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}