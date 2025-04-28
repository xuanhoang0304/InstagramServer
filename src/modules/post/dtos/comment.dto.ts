export interface CreateCommentDTO {
  createdBy: string;
  content: string;
  postId: string;
}

export interface CreateReplyCommentDTO {
  createdBy: string;
  content: string;
  postId: string;
  commentId: string;
  parentCommentId: string;
}

export interface UpdateCommentDTO {
  content: string;
}
