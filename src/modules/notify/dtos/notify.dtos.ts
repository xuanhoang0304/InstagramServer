import { BaseFilters } from '~/utils/baseRepository';

import { ENotifyStatus, ENotifyType, INotifyTarget } from '../model/notify.model';

export interface CreateNotify {
  sender: string;
  recipient: string;
  content: string;
  type: ENotifyType;
  title?: string;
  status?: ENotifyStatus;
  target: INotifyTarget;
}
export interface NotifyFilters extends BaseFilters {
  type?: ENotifyType;
  status?: ENotifyStatus;
  recipient?: string;
}
