import { Router } from 'express';

import authModule from './account/auth/auth.module';
import adminModule from './account/user/admin.module';
import userModule from './account/user/user.module';
import chatModule from './chat/chat.module';
import notifyModule from './notify/notify.module';
import postModule from './post/post.module';
import uploadModule from './upload/upload.module';

const modules = Router();
// account
modules.use('/', userModule);
modules.use('/', authModule);
modules.use('/', adminModule);
// post
modules.use('/', postModule);
// upload
modules.use('/', uploadModule);
// chat
modules.use('/', chatModule);
// notify
modules.use('/', notifyModule);
export default modules;
