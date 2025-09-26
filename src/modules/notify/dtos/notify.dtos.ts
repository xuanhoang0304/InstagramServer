import { BaseFilters } from '~/utils/baseRepository';

import { ENotifyStatus, ENotifyType, INotifyTarget } from '../model/notify.model';

export interface CreateNotify {
  sender: string;
  recipient: string;
  title?: string;
  content: string;
  type: ENotifyType;
  status?: ENotifyStatus;
  target?: INotifyTarget;
}
export interface NotifyFilters extends BaseFilters {
  type?: ENotifyType;
  status?: ENotifyStatus;
  recipient?: string;
}
