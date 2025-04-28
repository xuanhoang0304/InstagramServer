import { Router } from 'express';

import authModule from './account/auth/auth.module';
import userModule from './account/user/user.module';
import adminModule from './account/user/admin.module';
import postModule from './post/post.module';
import uploadModule from './upload/upload.module';
import chatModule from './chat/chat.module';

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
export default modules;
