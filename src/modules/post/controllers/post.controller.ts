import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IUser } from '~/modules/account/user/model/user.model';
import { BaseFilters } from '~/utils/baseRepository';
import { tryParseJson } from '~/utils/helpers';
import { HttpResponse } from '~/utils/httpResponse';

import { PostFilters } from '../dtos/post.dto';
import { PostService } from '../services/post.service';

export class PostController {
  async getPagination(req: Request, res: Response) {
    const { page = 1, limit = 10, sort, order, filters, sorts } = req.query;
    const filtersObj = tryParseJson(filters);
    const postFilters: PostFilters = {
      ...filtersObj,
      sorts,
      page: +page,
      limit: +limit,
      sort: sort as string,
      order: order === 'ASC' ? 'ASC' : 'DESC',
    };

    const result = await PostService.getPagination(postFilters);
    res.status(StatusCodes.OK).json(result);
  }
  async getPostByPostId(req: Request, res: Response) {
    const postId = req.params.postId;
    const result = await PostService.getPostByPostId(postId);
    res.status(StatusCodes.OK).json(result);
  }
  async getDiscoverPosts(req: Request, res: Response) {
    const curUser = req.user as IUser;
    const userId = String(curUser._id);
    const { page = 1, limit = 10, sort, order, filters } = req.query;
    const filtersObj = tryParseJson(filters);
    const Postfilters: PostFilters = {
      ...filtersObj,
      page: +page,
      limit: +limit,
      sort: sort as string,
      order: order === 'ASC' ? 'ASC' : 'DESC',
    };
    const result = await PostService.getDiscoverPosts(userId, Postfilters);
    res.status(StatusCodes.OK).json(result);
  }
  async getPostsByFollowing(req: Request, res: Response) {
    const curUser = req.user as IUser;
    const userId = String(curUser._id);
    const { page = 1, limit = 10, sort, order, filters } = req.query;
    const filtersObj = tryParseJson(filters);
    const Postfilters: PostFilters = {
      ...filtersObj,
      page: +page,
      limit: +limit,
      sort: sort as string,
      order: order === 'ASC' ? 'ASC' : 'DESC',
    };
    const result = await PostService.getPostsByFollowing(userId, Postfilters);
    res.status(StatusCodes.OK).json(result);
  }
  async getCommentsByPostId(req: Request, res: Response) {
    const postId = req.params.id;
    const { page = 1, limit = 10, sort, order } = req.query;

    const PostCommentsFilter: BaseFilters = {
      page: +page,
      limit: +limit,
      sort: sort as string,
      order: order === 'ASC' ? 'ASC' : 'DESC',
    };
    const result = await PostService.getCommentsByPostId(postId, PostCommentsFilter);
    res.status(StatusCodes.OK).json(HttpResponse.Paginate(result));
  }
  async create(req: Request, res: Response) {
    const user = req.user as IUser;
    const curUserId = String(user._id);
    const data = { ...req.body, curUserId };
    const result = await PostService.create(data);
    res.status(StatusCodes.CREATED).json(HttpResponse.created(result));
  }
  async update(req: Request, res: Response) {
    const user = req.user as IUser;
    const curUserId = String(user._id);
    const postId = req.params.postId;
    const data = { ...req.body, curUserId };
    const result = await PostService.update(postId, data);
    res.status(StatusCodes.OK).json(HttpResponse.updated(result));
  }
  async delete(req: Request, res: Response) {
    const user = req.user as IUser;
    const curUserId = String(user._id);
    const postId = req.params.postId;
    const result = await PostService.delete(postId, curUserId);
    res.status(200).json(HttpResponse.deleted(result));
  }
}
