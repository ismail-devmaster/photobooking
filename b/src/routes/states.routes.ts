// src/routes/states.routes.ts
import { Router } from 'express';
import * as stateCtrl from '../controllers/state.controller';

const router = Router();

// Public endpoints
router.get('/', stateCtrl.listStates); // paginated + search
router.get('/all', stateCtrl.listAllStates); // full list (id, name, code)

export default router;


