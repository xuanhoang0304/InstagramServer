import { Document, FilterQuery, Model } from 'mongoose';

export interface BaseFilters {
  sort?: string;
  order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}
export class BaseRepository {
  static getQuery(filters: BaseFilters) {
    const sort: Record<string, any> = {};
    const paginate = {
      page: 0,
      limit: 0,
      skip: 0,
    };
    // Check sort
    if (filters.sort && (filters.order === 'ASC' || filters.order === 'DESC')) {
      sort[filters.sort] = filters.order === 'ASC' ? 1 : -1;
    }
    // Check pagination
    if (filters.page && filters.limit) {
      paginate.skip = (filters.page - 1) * filters.limit;
      paginate.limit = filters.limit;
      paginate.page = filters.page;
    }
    return { sort, paginate };
  }
  static async create<T extends Document>(model: Model<T>, data: T) {
    return (await model.create(data)).toObject();
  }
  static async getById<T>(model: Model<T>, id: string) {
    return model.findById(id).lean();
  }
  static async getAll<T>(model: Model<T>) {
    return model.find();
  }
  static async getByField<T>(model: Model<T>, field: string, value: any) {
    const query: FilterQuery<T> = { [field]: value } as FilterQuery<T>;
    return model.findOne(query).lean();
  }
  static async getPagination<T, FiltersType extends BaseFilters>(
    model: Model<T>,
    condition: Record<string, any>,
    filters: FiltersType,
  ) {
    const { sort, paginate } = this.getQuery(filters);

    const filteredData = await model
      .find(condition)
      .sort(sort)
      .skip(paginate.skip)
      .limit(paginate.limit);
    const total = await model.find(condition).countDocuments();
    return { filteredData, totalFilteredData: total };
  }
  static async update<T extends Document>(model: Model<T>, id: string, data: T) {
    return model.findByIdAndUpdate(id, { $set: data }, { new: true });
  }
  static async delete<T>(model: Model<T>, id: string) {
    return model.findByIdAndDelete(id);
  }
}
