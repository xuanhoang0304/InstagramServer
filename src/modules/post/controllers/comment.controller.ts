import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IUser } from '~/modules/account/user/model/user.model';
import { BaseFilters } from '~/utils/baseRepository';
import { HttpResponse } from '~/utils/httpResponse';

import { CreateCommentDTO, CreateReplyCommentDTO, UpdateCommentDTO } from '../dtos/comment.dto';
import { CommentService } from '../services/comment.service';

export class CommentController {
  async getReplies(req: Request, res: Response) {
    const parentCommentId = req.params.commentId;
    const { page = 1, sort, limit = 10, order } = req.query;
    const filters: BaseFilters = {
      page: +page,
      limit: +limit,
      sort: sort as string,
      order: order === 'ASC' ? 'ASC' : 'DESC',
    };
    const result = await CommentService.getReplies(parentCommentId, filters);
    res.status(StatusCodes.OK).json(result);
  }
  async create(req: Request, res: Response) {
    const user = req.user as IUser;
    const createdBy = String(user._id);
    const data = { ...req.body, createdBy } as CreateCommentDTO;
    const result = await CommentService.create(data);
    res.status(StatusCodes.CREATED).json(HttpResponse.created(result));
  }
  async createReply(req: Request, res: Response) {
    const user = req.user as IUser;
    const createdBy = String(user._id);
    const commentId = req.params.commentId;
    const data = { ...req.body, createdBy, commentId } as CreateReplyCommentDTO;
    const result = await CommentService.createReply(data);
    res.status(StatusCodes.CREATED).json(HttpResponse.created(result));
  }
  async update(req: Request, res: Response) {
    const user = req.user as IUser;
    const createdBy = String(user._id);
    const commentId = req.params.commentId;
    const data = req.body as UpdateCommentDTO;
    const result = await CommentService.update(commentId, data, createdBy);
    res.status(StatusCodes.OK).json(HttpResponse.updated(result));
  }
  async delete(req: Request, res: Response) {
    const user = req.user as IUser;
    const createdBy = String(user._id);
    const commentId = req.params.commentId;
    const result = await CommentService.delete(commentId, createdBy);
    res.status(StatusCodes.OK).json(HttpResponse.deleted(result));
  }
  async getCmtById(req: Request, res: Response) {
    const commentId = req.params.commentId;
    const result = await CommentService.getCmtById(commentId);
    res.status(StatusCodes.OK).json(HttpResponse.Paginate(result));
  }
}
